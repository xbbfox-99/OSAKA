import React, { useState, useEffect } from 'react';
import { Plane, Home, Utensils, ShieldAlert, ExternalLink, MapPin, Plus, X, Loader2, ThumbsUp, ThumbsDown, CheckSquare, Square, ShoppingBag, Briefcase, Trash2, ChevronRight, ListChecks } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  setDoc, 
  doc, 
  serverTimestamp,
  deleteDoc,
  orderBy,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDocFromServer,
  increment,
  getDocs,
  where
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // If it's a "Failed to fetch", don't throw to avoid crashing the UI, just log it.
  if (errorMessage.includes('Failed to fetch')) {
    console.warn("Transient fetch error in Firestore operation");
    return;
  }

  throw new Error(JSON.stringify(errInfo));
}

export const InfoView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'packing' | 'shopping'>('overview');

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Sticky Tab Header */}
      <div className="sticky top-0 z-40 bg-bg-dark/80 backdrop-blur-md border-b border-border">
        <div className="flex px-6 h-14">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "flex-[1.2] h-full text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
              activeTab === 'overview' ? "text-primary" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            概覽
            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button 
            onClick={() => setActiveTab('packing')}
            className={cn(
              "flex-1 h-full text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
              activeTab === 'packing' ? "text-primary" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            行李
            {activeTab === 'packing' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button 
            onClick={() => setActiveTab('shopping')}
            className={cn(
              "flex-1 h-full text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
              activeTab === 'shopping' ? "text-primary" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            待買
            {activeTab === 'shopping' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        </div>
      </div>

      <div className="flex-1">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Flight Section */}
            <section>
              <div className="text-xs font-black tracking-[0.3em] uppercase text-zinc-400 mb-6 flex items-center gap-4">
                <div className="w-12 h-0.5 bg-primary/30" />
                航班資訊
              </div>
              <div className="space-y-8">
                <FlightCard 
                  date="5月03日" 
                  from="KHH" fromName="高雄" 
                  to="KIX" toName="大阪關西"
                  depTime="07:00" arrTime="11:00"
                  note="IT284 航班 // 04:00 UBER 出發"
                  accent="primary"
                />
                <FlightCard 
                  date="5月09日" 
                  from="KIX" fromName="大阪關西" 
                  to="KHH" toName="高雄"
                  depTime="11:55" arrTime="14:00"
                  note="IT285 航班 // 08:10 南海電鐵"
                  back
                  accent="primary"
                />
              </div>
            </section>

            {/* Hotel Section */}
            <section>
              <div className="text-xs font-black tracking-[0.3em] uppercase text-zinc-400 mb-6 flex items-center gap-4">
                <div className="w-12 h-0.5 bg-accent-gold/40" />
                住宿資訊
              </div>
              <div className="space-y-6">
                <HotelCard 
                  name="Hostel Kyoto Kizuna"
                  dates="05/03 – 05/04"
                  price="¥26,484 (已付)"
                  note="BOOKING明叡預定 // 五條站 5 號出口步行 4 分鐘"
                  link="https://forms.zohopublic.jp/suninc/form/hostelkizunabookingGuestRegister/formperma/Dm4nrTHLLMDMcYe0PVNFYMfAlqxs3OArUvok-7zAmPI"
                />
                <HotelCard 
                  name="RESI STAY HEART"
                  dates="05/04 – 05/07"
                  price="¥79,300"
                  note="Agoda 明叡預定 // 需回覆預計抵達時間 // 1 樓有洗衣房"
                />
                <HotelCard 
                  name="東橫 INN 大阪難波"
                  dates="05/07 – 05/09"
                  price="TWD 12,704"
                  note="Trip.com 耀軒預定"
                />
              </div>
            </section>

            {/* Restaurant Section */}
            <section>
              <div className="text-xs font-black tracking-[0.3em] uppercase text-zinc-400 mb-6 flex items-center gap-4">
                <div className="w-12 h-0.5 bg-border" />
                已確認預訂
              </div>
              <div className="border border-border bg-surface p-6 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">京都 / 燒肉</div>
                    <div className="text-xl font-black tracking-tight uppercase text-zinc-800">京の燒肉處 弘</div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase mt-1 tracking-widest">5月06日 (三) 19:30 // 京都站前店</div>
                  </div>
                  <div className="text-[8px] font-black uppercase tracking-widest border border-primary px-2 py-0.5 text-primary">耀軒預定</div>
                </div>

                <div className="w-full h-px bg-border/50" />

                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">大阪 / 燒肉</div>
                    <div className="text-xl font-black tracking-tight uppercase text-zinc-800">燒肉力丸</div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase mt-1 tracking-widest">5月07日 (四) 19:00 // 難波道頓堀店</div>
                  </div>
                  <div className="text-[8px] font-black uppercase tracking-widest border border-primary px-2 py-0.5 text-primary">偉晉預定</div>
                </div>
                
                <div className="w-full h-px bg-border/50" />

                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">海之京都一日遊</div>
                    <div className="text-xl font-black tracking-tight uppercase text-zinc-800">伊根 / 天橋立</div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase mt-1 tracking-widest">5月04日 (一) 08:00 AM // 京都站八条口</div>
                  </div>
                  <div className="text-[8px] font-black uppercase tracking-widest border border-primary px-2 py-0.5 text-primary">偉晉 (KKday)</div>
                </div>
              </div>
            </section>

            {/* Emergency Section */}
            <section>
              <div className="text-xs font-black tracking-[0.3em] uppercase text-primary mb-6 flex items-center gap-4">
                <div className="w-12 h-0.5 bg-primary/20" />
                緊急回報
              </div>
              <div className="grid grid-cols-2 gap-4">
                <EmergencyCard label="警察" number="110" />
                <EmergencyCard label="救護車 / 火警" number="119" />
                <EmergencyCard label="外交部急難救助" number="+886 800-085-095" className="col-span-2 py-8" />
              </div>
            </section>

            {/* Image Grid Section */}
            <section className="pb-12">
              <div className="text-xs font-black tracking-[0.3em] uppercase text-zinc-400 mb-6 flex items-center gap-4">
                <div className="w-12 h-0.5 bg-border" />
                Karina
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  'https://duk.tw/FUMSMp.jpg',
                  'https://duk.tw/25Imqx.jpg',
                  'https://duk.tw/mGOasn.jpg',
                  'https://duk.tw/VCI89S.jpg'
                ].map((url, i) => (
                  <div key={i} className="aspect-[3/4] overflow-hidden border-2 border-zinc-900 group relative bg-zinc-100">
                    <img 
                      src={url}
                      alt={`Trip snapshot ${i + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                ))}
              </div>
            </section>

            {/* User Upload Grid Section */}
            <section className="pb-12">
              <div className="text-xs font-black tracking-[0.3em] uppercase text-zinc-400 mb-6 flex items-center gap-4">
                <div className="w-12 h-0.5 bg-border" />
                旅客自由上傳
              </div>
              <UserPhotoGrid />
            </section>
          </div>
        )}
        {activeTab === 'packing' && (
          <div className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ChecklistView type="packing" title="行李清單" icon={<Briefcase className="w-4 h-4" />} />
          </div>
        )}
        {activeTab === 'shopping' && (
          <div className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ChecklistView type="shopping" title="待買清單" icon={<ShoppingBag className="w-4 h-4" />} />
          </div>
        )}
      </div>
    </div>
  );
};

const ChecklistView: React.FC<{ type: 'packing' | 'shopping', title: string, icon: React.ReactNode }> = ({ type, title, icon }) => {
  const [checklist, setChecklist] = useState<any>(null);
  const [newItemText, setNewItemText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(type === 'packing' ? '隨身行李' : '藥品');
  const [loading, setLoading] = useState(true);

  const packingCategories = ['隨身行李', '後背包', '托運行李'];
  const shoppingCategories = ['藥品', '服飾', '其他'];
  const currentCategories = type === 'packing' ? packingCategories : shoppingCategories;

  const defaultItems: Record<string, { text: string, category: string }[]> = {
    packing: [
      { text: '護照 (及其影本)', category: '隨身行李' },
      { text: '日幣現金 / 信用卡', category: '隨身行李' },
      { text: 'Suica / ICOCA / 交通票券', category: '隨身行李' },
      { text: '手機 / eSIM 漫遊開通', category: '隨身行李' },
      { text: '行動電源 (需隨身攜帶)', category: '後背包' },
      { text: '充電線 / 轉接頭', category: '後背包' },
      { text: '摺疊傘 / 雨具', category: '後背包' },
      { text: '備用眼鏡 / 隱形眼鏡', category: '後背包' },
      { text: '隨身感冒藥 / 止痛藥', category: '後背包' },
      { text: '衣物 (視天數而定)', category: '托運行李' },
      { text: '盥洗用品 / 保養品', category: '托運行李' },
      { text: '休足時間 / 痠痛貼布', category: '托運行李' },
      { text: '購物用大摺疊袋', category: '托運行李' },
    ],
    shopping: [
      { text: '合利他命 EX Plus', category: '其他' },
      { text: '參天眼藥水', category: '其他' },
      { text: 'UNIQLO 限定 T', category: '其他' },
    ]
  };

  useEffect(() => {
    const q = query(collection(db, 'checklists'), where('type', '==', type));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Initialize with default items if not exists
        const id = `${type}_main`;
        const initialItems = defaultItems[type].map((item, idx) => ({
          id: `item_${Date.now()}_${idx}`,
          text: item.text,
          completed: false,
          category: item.category
        }));
        
        await setDoc(doc(db, 'checklists', id), {
          id,
          type,
          items: initialItems,
          updatedAt: serverTimestamp()
        });
      } else {
        setChecklist(snapshot.docs[0].data());
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [type]);

  const toggleItem = async (itemId: string) => {
    if (!checklist) return;
    const updatedItems = checklist.items.map((item: any) => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await updateDoc(doc(db, 'checklists', checklist.id), {
      items: updatedItems,
      updatedAt: serverTimestamp()
    });
  };

  const addItem = async () => {
    if (!newItemText.trim() || !checklist) return;
    const newItem = {
      id: `item_${Date.now()}`,
      text: newItemText.trim(),
      completed: false,
      category: type === 'packing' ? selectedCategory : '其他'
    };
    await updateDoc(doc(db, 'checklists', checklist.id), {
      items: [...checklist.items, newItem],
      updatedAt: serverTimestamp()
    });
    setNewItemText('');
  };

  const removeItem = async (itemId: string) => {
    if (!checklist) return;
    const updatedItems = checklist.items.filter((item: any) => item.id !== itemId);
    await updateDoc(doc(db, 'checklists', checklist.id), {
      items: updatedItems,
      updatedAt: serverTimestamp()
    });
  };

  // Filter items based on selected category (only for packing list)
  const filteredItems = checklist 
    ? (type === 'packing' 
        ? checklist.items.filter((item: any) => (item.category || '其他') === selectedCategory)
        : checklist.items)
    : [];

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-4">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest">LOADING LIST...</span>
    </div>
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="text-xs font-black tracking-[0.3em] uppercase text-zinc-300 flex items-center gap-4">
          <div className="w-8 h-0.5 bg-border" />
          {icon}
          {type === 'packing' ? selectedCategory : title}
        </div>
        <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
          {filteredItems.filter((i: any) => i.completed).length} / {filteredItems.length}
        </div>
      </div>

      <div className="space-y-8 min-h-[300px]">
        {/* Category Tabs (Only for Packing List) */}
        {type === 'packing' && (
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-border/30">
            {currentCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                  selectedCategory === cat 
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                    : "bg-surface text-zinc-500 border-border hover:border-zinc-400"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className={cn(
          "grid gap-x-4 gap-y-1 animate-in fade-in duration-300",
          filteredItems.length > 0 ? "grid-cols-2" : "grid-cols-1"
        )}>
          {filteredItems.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between group py-2 px-1 hover:bg-surface/50 border-b border-border/20">
              <button 
                onClick={() => toggleItem(item.id)}
                className="flex items-center gap-3 flex-1 text-left min-w-0"
              >
                {item.completed ? (
                  <div className="w-4 h-4 bg-primary rounded-sm flex-shrink-0 flex items-center justify-center">
                    <CheckSquare className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="w-4 h-4 border-2 border-zinc-300 rounded-sm flex-shrink-0 group-hover:border-primary transition-colors" />
                )}
                <span className={cn(
                  "text-[13px] font-bold tracking-tight transition-all truncate",
                  item.completed ? "text-zinc-400 line-through decoration-primary/40" : "text-zinc-800"
                )}>
                  {item.text}
                </span>
              </button>
              <button 
                onClick={() => removeItem(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="py-20 text-center col-span-full">
              <ListChecks className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">目前沒有項目</p>
            </div>
          )}
        </div>

        {/* Add Entry */}
        <div className="pt-6 border-t border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                placeholder={type === 'packing' ? `新增到 ${selectedCategory}...` : "新增待買項目..."}
                className="w-full bg-surface border border-border px-4 py-3 text-sm font-bold tracking-tight placeholder:text-zinc-500 focus:outline-none focus:border-primary transition-all shadow-sm focus:shadow-md"
              />
            </div>
            <button 
              onClick={addItem}
              className="bg-primary text-white p-3.5 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>

  );
};

const UserPhotoGrid: React.FC = () => {
  const [photos, setPhotos] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const path = 'userPhotos';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Record<number, any> = {};
      snapshot.forEach((doc) => {
        const photo = doc.data();
        if (photo.slotIndex !== undefined && !data[photo.slotIndex]) {
          data[photo.slotIndex] = { id: doc.id, ...photo };
        }
      });
      setPhotos(data);
      setError(null);
    }, (err) => {
      setError("無法取得相片資訊，請稍後再試。");
      handleFirestoreError(err, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, []);

  const handleUpload = async (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(prev => ({ ...prev, [slotIndex]: true }));

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.7);

          const photoId = `slot_${slotIndex}_${Date.now()}`;
          const path = `userPhotos/${photoId}`;
          try {
            await setDoc(doc(db, 'userPhotos', photoId), {
              id: photoId,
              url: base64,
              slotIndex,
              userId: auth.currentUser?.uid || 'anon',
              userName: auth.currentUser?.displayName || '旅客',
              likes: [],
              dislikes: [],
              likesCount: 0,
              dislikesCount: 0,
              createdAt: serverTimestamp()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
          }
          setLoading(prev => ({ ...prev, [slotIndex]: false }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed", error);
      setLoading(prev => ({ ...prev, [slotIndex]: false }));
    }
  };

  const handleDelete = async (slotIndex: number, photoId: string) => {
    const path = `userPhotos/${photoId}`;
    try {
      await deleteDoc(doc(db, 'userPhotos', photoId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleReaction = async (photoId: string, type: 'likes' | 'dislikes') => {
    const userId = auth.currentUser?.uid || 'anon';
    const photo = Object.values(photos).find(p => p.id === photoId);
    if (!photo) return;

    const oppositeType = type === 'likes' ? 'dislikes' : 'likes';
    const hasCurrentReaction = photo[type]?.includes(userId);
    const hasOppositeReaction = photo[oppositeType]?.includes(userId);

    const docRef = doc(db, 'userPhotos', photoId);
    const path = `userPhotos/${photoId}`;

    // Field names for increment
    const countField = `${type}Count`;
    const oppositeCountField = `${oppositeType}Count`;

    try {
      if (hasCurrentReaction) {
        // Toggle off
        await updateDoc(docRef, { 
          [type]: arrayRemove(userId),
          [countField]: increment(-1)
        });
      } else {
        // Toggle on
        const updateData: any = {
          [type]: arrayUnion(userId),
          [countField]: increment(1)
        };

        // If they had the opposite reaction, remove it
        if (hasOppositeReaction) {
          updateData[oppositeType] = arrayRemove(userId);
          updateData[oppositeCountField] = increment(-1);
        }

        await updateDoc(docRef, updateData);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 flex items-center gap-3 text-red-600">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-tight">{error}</span>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {[...Array(16).keys()].map((slotIndex) => {
        const photo = photos[slotIndex];
        const userId = auth.currentUser?.uid || 'anon';
        const hasLiked = photo?.likes?.includes(userId);
        const hasDisliked = photo?.dislikes?.includes(userId);

        return (
          <div key={slotIndex} className="aspect-square border-2 border-zinc-900 bg-zinc-100 flex items-center justify-center relative group overflow-hidden">
            {photo ? (
              <>
                <img 
                  src={photo.url} 
                  alt={`Slot ${slotIndex}`} 
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => handleDelete(slotIndex, photo.id)}
                  className="absolute top-2 left-2 p-1 bg-transparent hover:bg-black/10 text-white/80 hover:text-white transition-colors z-10"
                >
                  <X className="w-3 h-3 drop-shadow-md" />
                </button>
                
                {/* Reactions Overlay */}
                <div className="absolute bottom-1 right-1 flex gap-1 z-10">
                  <button 
                    onClick={() => handleReaction(photo.id, 'likes')}
                    className={cn(
                      "p-1.5 rounded-full transition-all flex items-center gap-1 backdrop-blur-md border border-white/20",
                      hasLiked ? "bg-primary text-white shadow-lg" : "bg-black/60 text-white/70 hover:bg-black/80"
                    )}
                  >
                    <ThumbsUp className={cn("w-2.5 h-2.5", hasLiked && "fill-current")} />
                    {(photo.likesCount ?? 0) > 0 && (
                      <span className="text-[9px] font-bold">{photo.likesCount}</span>
                    )}
                  </button>
                  <button 
                    onClick={() => handleReaction(photo.id, 'dislikes')}
                    className={cn(
                      "p-1.5 rounded-full transition-all flex items-center gap-1 backdrop-blur-md border border-white/20",
                      hasDisliked ? "bg-zinc-800 text-white shadow-lg" : "bg-black/60 text-white/70 hover:bg-black/80"
                    )}
                  >
                    <ThumbsDown className={cn("w-2.5 h-2.5", hasDisliked && "fill-current")} />
                    {(photo.dislikesCount ?? 0) > 0 && (
                      <span className="text-[9px] font-bold">{photo.dislikesCount}</span>
                    )}
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent text-white text-[8px] py-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center pr-20">
                  <span className="truncate max-w-[60px] font-medium">{photo.userName}</span>
                </div>
              </>
            ) : (
              <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-primary transition-colors">
                {loading[slotIndex] ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">上傳</span>
                  </>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleUpload(slotIndex, e)} 
                  disabled={!!loading[slotIndex]}
                />
              </label>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
};

const FlightCard: React.FC<any> = ({ date, from, fromName, to, toName, depTime, arrTime, note, back, accent }) => {
  const accentColor = 'text-primary';
  const accentBg = 'bg-primary/40';

  return (
    <div className="border-t border-border pt-6 flex flex-col bg-surface hover:bg-surface/80 transition-colors px-4 pb-6 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col">
          <span className={cn("font-mono text-[9px] tracking-[0.2em] uppercase mb-1 font-bold", accentColor)}>{back ? '回程' : '去程'} // OSK-2026</span>
          <h3 className="text-4xl font-black tracking-tighter uppercase leading-none text-zinc-900">{date}</h3>
        </div>
        <Plane className={cn("w-8 h-8 opacity-40", accentColor, back && "rotate-180")} />
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="text-left">
          <div className="text-2xl font-black tracking-tighter uppercase text-zinc-800">{from}</div>
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{fromName}</div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-0 px-4">
          <div className="w-full h-1 bg-border/50 overflow-hidden">
            <div className={cn("h-full animate-pulse", accentBg, back ? "w-full" : "w-1/2")} />
          </div>
          <div className="text-[8px] font-mono text-zinc-400 mt-2 tracking-widest uppercase">直飛航班</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black tracking-tighter uppercase text-zinc-800">{to}</div>
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{toName}</div>
        </div>
      </div>

      <div className={cn("grid grid-cols-2 gap-4 border-l-2 pl-4 py-2", accent === 'coral' ? 'border-primary/20' : 'border-primary/20')}>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold mb-1">起飛時間</div>
          <div className="text-sm font-black text-zinc-800">{depTime}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold mb-1">抵達時間</div>
          <div className="text-sm font-black text-zinc-800">{arrTime}</div>
        </div>
      </div>
      
      {note && (
        <div className="mt-6 flex items-center gap-2 text-[9px] text-zinc-400 font-black uppercase tracking-widest border border-border w-fit px-3 py-1 bg-bg-dark/50">
          <MapPin className="w-2 h-2" />
          {note}
        </div>
      )}
    </div>
  );
};

const HotelCard: React.FC<any> = ({ name, dates, price, note, link }) => (
  <div className="border-t border-border pt-6 pb-6 hover:bg-surface transition-colors px-2">
    <div className="flex justify-between items-start mb-2">
      <div className="text-xs font-black text-primary tracking-widest uppercase">{dates}</div>
      {price && <div className="text-[10px] font-mono font-bold bg-bg-dark px-2 py-0.5 border border-border uppercase text-zinc-500">{price}</div>}
    </div>
    <div className="text-xl font-black tracking-tighter uppercase mb-2 leading-tight text-zinc-800">{name}</div>
    {note && <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{note}</div>}
    {link && (
      <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-4 text-[9px] font-black uppercase tracking-widest group text-zinc-400 hover:text-primary transition-colors">
        <div className="w-6 h-6 rounded-none bg-bg-dark border border-border flex items-center justify-center group-hover:border-primary transition-colors">
          <ExternalLink className="w-2.5 h-2.5 group-hover:text-primary transition-colors" />
        </div>
        旅客登記表單
      </a>
    )}
  </div>
);

const EmergencyCard: React.FC<any> = ({ label, number, className }) => (
  <div className={cn("border border-border bg-surface pt-6 pb-4 px-4 flex flex-col items-center justify-center text-center shadow-sm", className)}>
    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">{label}</div>
    <div className="text-4xl font-black text-primary tracking-tighter">{number}</div>
  </div>
);
