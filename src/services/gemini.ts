import { GoogleGenAI, Type } from "@google/genai";
import preGeneratedGuides from '../data/preGeneratedGuides.json';

let ai: any = null;

function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("🔑 API Key check:", apiKey ? "Defined" : "UNDEFINED");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please set it in Settings.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

// Helper to clean JSON string from potential markdown markers
function cleanJsonString(str: string): string {
  return str.replace(/```json\n?|\n?```/g, '').trim();
}

export function getPreGeneratedGuide(title: string, query: string): string | null {
  const key = `${title}_${query}`;
  return (preGeneratedGuides as any)[key] || null;
}

export async function getDestinationGuideStream(
  title: string, 
  query: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  // Check pre-generated first
  const cached = getPreGeneratedGuide(title, query);
  if (cached) {
    onChunk(cached);
    return;
  }

  let client;
  try {
    client = getAI();
  } catch (err) {
    console.error("AI Initialization Error:", err);
    onChunk("\n\n⚠️ API 金鑰未設定，請在設定中配置 GEMINI_API_KEY。");
    return;
  }
  
  const prompt = `你是一位專業的日本旅遊導覽，熟悉大阪和京都的所有景點、美食和文化。
請詳細介紹「${title}」，參考關鍵字：${query}。

回覆要求：
1. 使用繁體中文。
2. 格式簡潔，適合手機閱讀。
3. 包含：景點故事/背景、必看/必吃重點、實用入園/用餐小技巧。
4. 每段落開頭使用相關 emoji。
5. 語氣親切活潑。`;

  try {
    const result = await client.models.generateContentStream({
      model: "gemini-flash-latest",
      contents: prompt
    });

    for await (const chunk of result) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Gemini Guide Stream Error:", error);
    onChunk("\n\n⚠️ 抱歉，導覽生成遇到問題，請稍後再試。");
  }
}

export async function getDestinationGuide(title: string, query: string): Promise<string> {
  let client;
  try {
    client = getAI();
  } catch (err) {
    console.error("AI Initialization Error:", err);
    return "API 金鑰未設定，請在設定中配置 GEMINI_API_KEY。";
  }
  
  const prompt = `你是一位專業的日本旅遊導覽，熟悉大阪和京都的所有景點、美食和文化。
請詳細介紹「${title}」，參考關鍵字：${query}。

回覆要求：
1. 使用繁體中文。
2. 格式簡潔，適合手機閱讀。
3. 包含：景點故事/背景、必看/必吃重點、實用入園/用餐小技巧。
4. 每段落開頭使用相關 emoji。
5. 語氣親切活潑。`;

  try {
    const result = await client.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt
    });
    return (result.text as string) || "暫時無法取得導覽資訊，請稍後再試。";
  } catch (error) {
    console.error("Gemini Guide Error:", error);
    return "暫時無法取得導覽資訊，請稍後再試。";
  }
}

export interface ScannedReceipt {
  date: string;
  store: string;
  amount: number;
  preTaxAmount?: number;
  items: { name: string; translatedName: string; price: number }[];
}

export async function scanReceipt(base64Image: string, mimeType: string): Promise<ScannedReceipt | null> {
  console.log("🚀 Starting Japanese Receipt AI Scan...");
  let client;
  try {
    client = getAI();
  } catch (err) {
    console.error("AI Initialization Error:", err);
    return null;
  }

  const prompt = `你是一個精通日文與中文的收據專家。請從這張日本收據圖檔中精確提取相關資訊。

任務目標：
1. **店名 (store)**: 辨識收據最上方的店家名稱。
2. **日期 (date)**: 格式必須為 YYYY-MM-DD。若原始格式為和曆 (如 R6.4.10)，請轉換為 2024-04-10。若無年份則推斷為 2026。
3. **總金額 (amount)**: 找出最後支付的「合計」或「税込合計」金額 (即總金額)。
4. **小計金額 (preTaxAmount)**: 找出收據上的「小計」(即已稅金額/分項總和)。
5. **明細 (items)**: 
   - 提取所有消費項目。
   - name: 原始日文名稱。
   - translatedName: 精確的繁體中文翻譯（讓非日語使用者能秒懂）。
   - price: 該項目的金額。

注意事項：
- 這是日本收據，請特別留意「合計」與「小計」的區別。
- 優先讀取印刷體文字，忽略手寫筆記。
- 移除數字中的逗號。
- 嚴格遵守 JSON 格式回傳，確保速度與精確度。`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-flash-latest",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "日期 (YYYY-MM-DD)" },
            store: { type: Type.STRING, description: "店家名稱" },
            amount: { type: Type.NUMBER, description: "總金額 (合計)" },
            preTaxAmount: { type: Type.NUMBER, description: "已稅金額 (小計)" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "日文原名" },
                  translatedName: { type: Type.STRING, description: "繁體中文翻譯" },
                  price: { type: Type.NUMBER, description: "金額" }
                }
              }
            }
          },
          required: ["date", "store", "amount", "items"]
        }
      }
    });
    
    const rawText = response.text || "{}";
    const cleanedText = cleanJsonString(rawText);
    console.log("✅ Scan Success (Raw):", rawText);
    const data = JSON.parse(cleanedText);
    
    return {
      date: data.date || new Date().toISOString().split('T')[0],
      store: data.store || '未知店家',
      amount: Number(data.amount) || 0,
      preTaxAmount: data.preTaxAmount ? Number(data.preTaxAmount) : undefined,
      items: (data.items || []).map((item: any) => ({
        name: item.name || '項目',
        translatedName: item.translatedName || '未翻譯',
        price: Number(item.price) || 0
      }))
    };
  } catch (error) {
    console.error("❌ Gemini Scan Error:", error);
    return null;
  }
}
