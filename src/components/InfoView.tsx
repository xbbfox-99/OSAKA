import React, { useState, useEffect } from 'react';
import { Plane, Home, Utensils, ShieldAlert, ExternalLink, MapPin, Plus, X, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
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
  getDocFromServer
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
  return (
    <div className="p-6 pb-24 space-y-12">
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

    try {
      if (hasCurrentReaction) {
        await updateDoc(docRef, { [type]: arrayRemove(userId) });
      } else {
        await updateDoc(docRef, { 
          [type]: arrayUnion(userId),
          [oppositeType]: arrayRemove(userId)
        });
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
                    {photo.likes?.length > 0 && (
                      <span className="text-[9px] font-bold">{photo.likes.length}</span>
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
                    {photo.dislikes?.length > 0 && (
                      <span className="text-[9px] font-bold">{photo.dislikes.length}</span>
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
