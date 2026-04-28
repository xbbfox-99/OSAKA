import { Day } from './types';

export const MEMBERS = ['耀軒', '偉晉', '小六', '明叡'];
export const MEMBER_COLORS = ['#e94560', '#f5a623', '#06d6a0', '#c77dff'];
export const JPY_TWD = 0.213;

export const CATEGORIES = ['🍜 餐飲', '🚃 交通', '🎡 景點', '🛍️ 購物', '🏨 住宿', '📦 其他'];

export const DAYS: Day[] = [
  { 
    label: '5/3 日', title: '台灣出發', loc: '京都市', lat: 34.985, lon: 135.758,
    items: [
      { time: '04:00', type: 'transit', icon: '🚗', title: 'Uber 出發', body: '前往小港機場 (台灣時間)' },
      { time: '04:30', type: 'transit', icon: '✈️', title: '抵達小港機場', body: '' },
      { time: '07:00', type: 'transit', icon: '🛫', title: '小港機場起飛 (IT284)', body: '航班號碼 IT284' },
      { time: '11:00', type: 'transit', icon: '🛬', title: '抵達關西機場 (KIX)', body: '日本時間 11:00' },
      { time: '12:30', type: 'misc', icon: '🍱', title: '出關 / 逛機場 / 午餐', body: '', guide: '關西機場 抵達 逛街 午餐 推薦' },
      { time: '14:44', type: 'transit', icon: '🚆', title: '搭乘 HARUKA JR 快線', body: '目前未定票 (約台幣 408*4 元)\n所需時間 1 小時 20 分鐘', map: '關西機場駅' },
      { time: '16:04', type: 'transit', icon: '🏯', title: '抵達京都車站', body: '' },
      { time: '16:30', type: 'hotel', icon: '🛏️', title: 'Hostel Kyoto Kizuna CHECK IN', body: '烏丸線五條站 5 號出口步行 4 分鐘\n¥26,484 元已付 (BOOKING明叡預定)', tags: [{ type: 'booking', text: 'BOOKING明叡預定' }, { type: 'price', text: '¥26,484 PAID' }], map: 'Hostel Kyoto Kizuna' },
      { time: '18:00', type: 'misc', icon: '😴', title: '休息結束前往東寺', body: '' },
      { time: '18:30', type: 'sight', icon: '⛩️', title: '東寺', body: '金堂・講堂夜間特別點燈\n開放時間：18:00–21:30', tags: [{ type: 'price', text: '¥1,000/人' }], map: '東寺 京都', guide: '東寺 京都 夜間點燈 歷史' },
      { time: '19:30', type: 'food', icon: '🍜', title: '京都車站吃飯', body: '京都車站拉麵小路 (10樓) / Porta 地下街 / 鐵板酒場 Hiroshi', tags: [{ type: 'food', text: '拉麵小路 10F' }, { type: 'menu', text: '鐵板酒場 Hiroshi' }], map: '京都駅 拉麵小路', guide: '京都車站拉麵小路 推薦' },
    ]
  },
  { 
    label: '5/4 一', title: '海之京都一日遊', loc: '天橋立', lat: 35.565, lon: 135.183,
    items: [
      { time: '05:50', type: 'misc', icon: '⏰', title: 'Hostel Kyoto Kizuna 起床', body: '' },
      { time: '06:30', type: 'transit', icon: '🚶', title: '出發', body: '' },
      { time: '07:00', type: 'transit', icon: '🧳', title: '京都車站寄放行李 / 超商早餐', body: '注意有無位置', map: '京都駅 コインロッカー' },
      { time: '08:00', type: 'transit', icon: '🚌', title: '集合：海之京都一日遊', body: '京都車站八条口・祭時計廣場\nkkday 偉晉預定 (台幣 9,880 元)', tags: [{ type: 'booking', text: '偉晉 KKday' }, { type: 'price', text: 'TWD 9,880' }], map: '京都駅八条口' },
      { time: '09:00', type: 'sight', icon: '🪷', title: '1. 智恩寺', body: '約40~60分鐘', map: '智恩寺 天橋立', guide: '智恩寺 天橋立 歷史 特色' },
      { time: '10:30', type: 'sight', icon: '⛩️', title: '2. 元伊勢籠神社', body: '含用餐，合計停留約 120 分鐘', map: '元伊勢籠神社', guide: '元伊勢籠神社 歷史 能量景點' },
      { time: '11:00', type: 'food', icon: '🦞', title: '3. 烤鮑魚海鮮鍋御膳套餐', body: '含於一日遊套票', tags: [{ type: 'food', text: '烤鮑魚' }], guide: '天橋立 烤鮑魚海鮮鍋 推薦' },
      { time: '13:00', type: 'sight', icon: '🚡', title: '4. 天橋立傘松公園', body: '在「府中站」搭纜車或單人吊車', map: '天橋立傘松公園', guide: '天橋立 傘松公園 昇龍觀' },
      { time: '14:00', type: 'sight', icon: '🐲', title: '5. 「股見」欣賞「昇龍觀」', body: '' },
      { time: '14:30', type: 'sight', icon: '🚤', title: '6. 漫步伊根舟屋群', body: '約 30~45 分鐘', map: '伊根舟屋', guide: '伊根舟屋 日本重要傳統建築' },
      { time: '15:00', type: 'transit', icon: '🚌', title: '回程', body: '' },
      { time: '17:30', type: 'transit', icon: '🏯', title: '預估時間到達京都', body: '' },
      { time: '18:00', type: 'hotel', icon: '🛏️', title: '取行李 Check in RESI STAY HEART', body: '¥79,300 元 (agoda 明叡預定)\n1 樓設有自助洗衣房\n(需回覆預計抵達時間)', tags: [{ type: 'price', text: '¥79,300' }, { type: 'booking', text: '明叡預定' }], map: 'RESI STAY HEART Kyoto' },
      { time: '19:00', type: 'food', icon: '🍣', title: '晚餐 / 逛街', body: '', map: '京都駅' },
    ]
  },
  { 
    label: '5/5 二', title: '鐵道博物館 × 伏見稻荷', loc: '京都市', lat: 34.985, lon: 135.758,
    items: [
      { time: '08:30', type: 'misc', icon: '⏰', title: 'RESI STAY HEART 起床', body: '' },
      { time: '09:00', type: 'transit', icon: '🚶', title: '出門 / 超商早餐', body: '' },
      { time: '10:00', type: 'sight', icon: '🚂', title: '京都鐵道博物館', body: '¥1,500 元 (未預定)', tags: [{ type: 'price', text: '¥1,500/人' }], map: '京都鉄道博物館', guide: '京都鐵道博物館 展覽 必看' },
      { time: '13:00', type: 'food', icon: '🍜', title: '離開 / 簡單午餐', body: '' },
      { time: '14:30', type: 'sight', icon: '⛩️', title: '伏見稻荷大社', body: '朱紅千本鳥居', map: '伏見稻荷大社', guide: '伏見稻荷大社 千本鳥居 歷史 攻略' },
      { time: '16:20', type: 'transit', icon: '🚶', title: '離開', body: '' },
      { time: '17:00', type: 'food', icon: '🐟', title: 'Ginsui 銀水', body: '無法預定，現場排隊', tags: [{ type: 'food', text: '現場排隊' }], map: 'Ginsui 銀水 京都', guide: '銀水 京都 鴨川 壽喜燒 推薦' },
      { time: '19:00', type: 'misc', icon: '🌊', title: '高島屋 / 鴨川附近逛逛', body: '', map: '京都高島屋', guide: '京都 高島屋 鴨川 漫步 攻略' },
    ]
  },
  { 
    label: '5/6 三', title: '清水寺晨遊 × 燒肉之夜', loc: '京都市', lat: 34.994, lon: 135.785,
    items: [
      { time: '04:30', type: 'misc', icon: '⏰', title: 'RESI STAY HEART 起床', body: '' },
      { time: '05:00', type: 'transit', icon: '🚗', title: '出門清水寺', body: '約 2.6km (uber 約日幣 2500，可以先預約)', tags: [{ type: 'price', text: 'Uber ~¥2,500' }] },
      { time: '05:10', type: 'sight', icon: '📸', title: '拍八坂通、清水通、一二三年坂', body: '' },
      { time: '06:00', type: 'sight', icon: '⛩️', title: '清水寺開門', body: '建議先直奔清水舞台 → 奧之院\n(內部御朱印/御守 08:00/08:30 開放)', map: '清水寺', guide: '清水寺 清晨 攻略 奧之院 音羽之瀑' },
      { time: '08:30', type: 'misc', icon: '🛍️', title: '逛清水寺開門店家', body: '八坂神社、星巴克二寧坂店、橡子共和國、七味家本舖、Snoopy Chocolat', tags: [{ type: 'buy', text: '逛街' }], map: '二寧坂 星巴克', guide: '清水寺 店家 推薦' },
      { time: '11:00', type: 'food', icon: '🍱', title: '午餐', body: '清水寺吃 / 京都車站吃', map: '清水寺' },
      { time: '13:00', type: 'hotel', icon: '💤', title: '飯店睡爛', body: 'RESI STAY HEART' },
      { time: '16:00', type: 'misc', icon: '🗼', title: '出門逛逛', body: '京都塔、JR 京都伊勢丹、京都站前地下街 (Porta)、東本願寺', map: '京都塔', guide: '京都車站 購物攻略' },
      { time: '19:30', type: 'food', icon: '🥩', title: '京的燒肉處 弘 京都站前店', body: '耀軒預定', tags: [{ type: 'booking', text: '耀軒預定' }, { type: 'food', text: '和牛燒肉' }], map: '京の焼肉處 弘 京都駅前店', guide: '京の燒肉處 弘 菜單 必點' },
    ]
  },
  { 
    label: '5/7 四', title: '移動大阪', loc: '大阪市', lat: 34.693, lon: 135.502,
    items: [
      { time: '07:10', type: 'misc', icon: '⏰', title: 'RESI STAY HEART 起床', body: '' },
      { time: '07:50', type: 'transit', icon: '🧳', title: '退房', body: '' },
      { time: '08:00', type: 'transit', icon: '🧳', title: '京都車站寄行李', body: '' },
      { time: '08:30', type: 'food', icon: '🥞', title: 'Kacto 早餐', body: '無預定現場排', tags: [{ type: 'food', text: '現場排隊' }], map: 'Kacto Kyoto', guide: 'Kacto Kyoto 早餐 推薦' },
      { time: '10:30', type: 'transit', icon: '🚶', title: '離開餐廳', body: '' },
      { time: '11:00', type: 'sight', icon: '🌿', title: '下鴨神社', body: '世界遺產', map: '下鴨神社', guide: '下鴨神社 歷史 特色' },
      { time: '13:30', type: 'transit', icon: '🚶', title: '離開下鴨', body: '' },
      { time: '14:10', type: 'food', icon: '🍱', title: '抵達京都車站 / 午餐簡單吃', body: '' },
      { time: '15:00', type: 'transit', icon: '🚆', title: '前往大阪', body: '東海道、山陽本線', map: '京都駅' },
      { time: '16:00', type: 'hotel', icon: '🏨', title: '東橫 INN 大阪難波 CHECK IN', body: '台幣 12,704 元 (Trip 耀軒預定)', tags: [{ type: 'price', text: 'TWD 12,704' }, { type: 'booking', text: '耀軒預定' }], map: '東橫INN大阪難波' },
      { time: '17:00', type: 'misc', icon: '🛍️', title: '逛街心齋橋筋、道頓堀漫步', body: '', guide: '大阪 心齋橋 道頓堀 購物 美食 攻略' },
      { time: '19:00', type: 'food', icon: '🥩', title: '燒肉力丸 難波道頓掘店', body: '偉晉預定', tags: [{ type: 'booking', text: '偉晉預定' }], map: '燒肉力丸 難波道頓堀店', guide: '燒肉力丸 推薦 菜單' },
    ]
  },
  { 
    label: '5/8 五', title: '勝尾寺 × 大阪', loc: '大阪市', lat: 34.693, lon: 135.502,
    items: [
      { time: '06:50', type: 'misc', icon: '⏰', title: '東橫 INN 大阪難波 起床', body: '' },
      { time: '07:30', type: 'transit', icon: '🚶', title: '出門 / 早餐', body: '' },
      { time: '08:16', type: 'transit', icon: '🚆', title: '搭車前往勝尾寺', body: '' },
      { time: '09:30', type: 'sight', icon: '🎎', title: '抵達勝尾寺', body: '達摩寺', map: '勝尾寺 大阪', guide: '勝尾寺 大阪 達摩 歷史 攻略' },
      { time: '12:00', type: 'transit', icon: '🚶', title: '離開勝尾寺', body: '' },
      { time: '12:20', type: 'transit', icon: '🚌', title: '搭乘公車', body: '' },
      { time: '13:30', type: 'food', icon: '🥘', title: 'お好み鉄板酒場どら十 (DORAJYU) 午餐', body: '大阪風鐵板燒', tags: [{ type: 'food', text: '鐵板燒' }], map: 'どら十 大阪', guide: '大阪 鐵板燒 どら十 推薦' },
      { time: '15:00', type: 'misc', icon: '🛍️', title: '吃完午餐逛街', body: '' },
      { time: '19:00', type: 'food', icon: '🍛', title: 'KUSAKA CURRY 晚餐', map: 'KUSAKA CURRY 大阪', guide: '大阪 KUSAKA CURRY 推薦' },
      { time: '23:00', type: 'food', icon: '🍜', title: '人情麵家 牛骨王 宵夜', map: '人情麺家 牛骨王 大阪', guide: '大阪 人情麵家 牛骨王 推薦' },
    ]
  },
  { 
    label: '5/9 六', title: '回家囉', loc: '關西機場', lat: 34.434, lon: 135.244,
    items: [
      { time: '06:40', type: 'misc', icon: '⏰', title: '東橫 INN 大阪難波 起床', body: '' },
      { time: '07:20', type: 'hotel', icon: '🧳', title: '退房 / 超商早餐', body: '' },
      { time: '08:10', type: 'transit', icon: '🚆', title: '搭乘南海本線', body: '前二日劃位車票 (¥970*4 人)', tags: [{ type: 'price', text: '¥3,880 total' }], map: 'なんば駅 南海' },
      { time: '08:57', type: 'transit', icon: '🛬', title: '關西機場入關 / 逛機場 / 午餐', body: '' },
      { time: '11:55', type: 'transit', icon: '🛫', title: '飛機起飛時間 (IT285)', body: '航班號碼 IT285' },
      { time: '14:00', type: 'misc', icon: '🏠', title: '抵達高雄', body: '台灣時間' },
    ]
  }
];
