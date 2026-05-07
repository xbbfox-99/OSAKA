import React, { useState, useEffect, useRef } from 'react';
import { Camera, Plus, Trash2, Users, User, ArrowRightLeft, Loader2, CheckCircle2, GripVertical, List, JapaneseYen, PieChart, X, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { collection, addDoc, deleteDoc, onSnapshot, query, doc, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { MEMBERS, MEMBER_COLORS, JPY_TWD, CATEGORIES } from '../constants';
import { Expense, SplitExpense } from '../types';
import { scanReceipt } from '../services/gemini';
import { cn } from '../lib/utils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  if (errorMessage.includes('Failed to fetch')) {
    console.warn("Transient fetch error in Firestore operation");
    return;
  }
  
  // We can choose not to throw here if we want to avoid crashing the whole tab, 
  // but usually it's good to let the user know if a CREATE or DELETE failed.
  if (operationType === OperationType.CREATE || operationType === OperationType.DELETE || operationType === OperationType.WRITE) {
    alert("操作失敗，請檢查網路連接或稍後再試。");
  }
}

export const BudgetView: React.FC = () => {
  const [tab, setTab] = useState<'personal' | 'split'>(() => {
    return (localStorage.getItem('budget_last_tab') as any) || 'personal';
  });
  const [currency, setCurrency] = useState<'JPY' | 'TWD'>('JPY');
  
  // Expenses State from Firestore
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Split State from Firestore
  const [splitExpenses, setSplitExpenses] = useState<SplitExpense[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    preTaxAmount: '',
    date: new Date().toISOString().split('T')[0],
    currency: 'JPY' as 'JPY' | 'TWD',
    category: CATEGORIES[0],
    store: '',
    items: [] as { name: string; translatedName?: string; price: number }[]
  });

  const [currentMember, setCurrentMember] = useState(() => {
    return parseInt(localStorage.getItem('budget_last_member') || '0');
  });

  const [isMigrating, setIsMigrating] = useState(false);
  
  useEffect(() => {
    localStorage.setItem('budget_last_tab', tab);
  }, [tab]);

  useEffect(() => {
    localStorage.setItem('budget_last_member', currentMember.toString());
  }, [currentMember]);

  useEffect(() => {
    const migrate = async () => {
      setIsMigrating(true);
      try {
        const { getDocs, updateDoc, collection: fsCollection } = await import('firebase/firestore');
        const collections = ['expenses', 'splitExpenses'];
        let migratedCount = 0;
        for (const collName of collections) {
          const snap = await getDocs(fsCollection(db, collName));
          for (const docSnap of snap.docs) {
            const data = docSnap.data();
            if (data.order === undefined) {
              await updateDoc(docSnap.ref, { order: Date.now() + migratedCount });
              migratedCount++;
            }
          }
        }
        if (migratedCount > 0) console.log(`✅ Migrated ${migratedCount} records with 'order' field.`);
      } catch (err) {
        console.error("Migration failed:", err);
      } finally {
        setIsMigrating(false);
      }
    };
    migrate();
  }, []);

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [splitChecked, setSplitChecked] = useState([true, true, true, true]);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showItemsFor, setShowItemsFor] = useState<string | number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const splitFileInputRef = useRef<HTMLInputElement>(null);

  const currentMemberName = MEMBERS[currentMember];

  // Firestore Sync
  useEffect(() => {
    const qExpenses = query(collection(db, 'expenses'), orderBy('order', 'asc'));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      const data = snapshot.docs.map(document => ({ 
        ...document.data(), 
        id: document.id 
      })) as any[];
      setExpenses(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'expenses'));

    const qSplit = query(collection(db, 'splitExpenses'), orderBy('order', 'asc'));
    const unsubSplit = onSnapshot(qSplit, (snapshot) => {
      const data = snapshot.docs.map(document => ({ 
        ...document.data(), 
        id: document.id 
      })) as any[];
      setSplitExpenses(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'splitExpenses'));

    return () => {
      unsubExpenses();
      unsubSplit();
    };
  }, []);

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>, isSplit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanStatus('idle');
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = (ev) => resolve((ev.target?.result as string).split(',')[1]);
        reader.onerror = (err) => reject(err);
      });
      
      reader.readAsDataURL(file);
      const base64 = await base64Promise;
      
      const result = await scanReceipt(base64, file.type);
      
      if (result) {
        setScanStatus('success');
        if (isSplit) {
          const splitAmountInput = document.getElementById('splitAmount') as HTMLInputElement;
          const splitNameInput = document.getElementById('splitName') as HTMLInputElement;
          const splitDateInput = document.getElementById('splitDate') as HTMLInputElement;
          if (splitAmountInput) splitAmountInput.value = result.amount.toString();
          if (splitNameInput) splitNameInput.value = result.store || '熱門景點/餐廳';
          if (splitDateInput) splitDateInput.value = result.date || splitDateInput.value;
        } else {
          setFormData(prev => ({
            ...prev,
            amount: result.amount.toString(),
            preTaxAmount: result.preTaxAmount?.toString() || '',
            name: result.store || prev.name,
            store: result.store || '',
            date: result.date || prev.date,
            items: (result.items || []).filter(i => i.price > 0 || i.name)
          }));
        }
        setTimeout(() => setScanStatus('idle'), 3000);
      } else {
        setScanStatus('error');
        alert('辨識失敗，請確保照片清晰且是日本收據。');
      }
    } catch (err: any) {
      console.error("Scanning Error:", err);
      setScanStatus('error');
      if (err.message === 'QUOTA_EXCEEDED') {
        alert('API 使用額度已達上限。請換個時間再試，或在「設定」中確認 API 金鑰狀態。');
      } else {
        alert(`辨識出錯：${err.message || '未知錯誤'}`);
      }
    } finally {
      setIsScanning(false);
      e.target.value = '';
    }
  };

  const addExpense = async () => {
    const { name, amount, preTaxAmount, currency, category, date, store, items } = formData;
    const numAmount = parseFloat(amount);
    const numPreTax = preTaxAmount ? parseFloat(preTaxAmount) : undefined;
    
    if (!name.trim()) return alert('請輸入項目名稱');
    if (isNaN(numAmount)) return alert('請輸入有效金額');

    const dateValue = date ? new Date(date) : new Date();
    const formattedDate = `${dateValue.getFullYear()}-${(dateValue.getMonth() + 1).toString().padStart(2, '0')}-${dateValue.getDate().toString().padStart(2, '0')}`;

    const newExp: any = {
      member: currentMember,
      name: name.trim(),
      amount: numAmount,
      currency,
      category,
      date: formattedDate,
      store: store || name.trim(),
      items,
      createdAt: new Date().toISOString(),
      userId: auth.currentUser?.uid || 'guest',
      order: Date.now() // Initial order
    };

    if (numPreTax !== undefined && !isNaN(numPreTax)) {
      newExp.preTaxAmount = numPreTax;
    }

    try {
      await addDoc(collection(db, 'expenses'), newExp);
      setFormData({
        name: '',
        amount: '',
        preTaxAmount: '',
        date: new Date().toISOString().split('T')[0],
        currency: 'JPY',
        category: CATEGORIES[0],
        store: '',
        items: []
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
    }
  };

  const addSplitExpense = async () => {
    const nameEl = document.getElementById('splitName') as HTMLInputElement;
    const amountEl = document.getElementById('splitAmount') as HTMLInputElement;
    const currEl = document.getElementById('splitCurrency') as HTMLSelectElement;
    const payerEl = document.getElementById('splitPayer') as HTMLSelectElement;
    const dateEl = document.getElementById('splitDate') as HTMLInputElement;

    const name = nameEl.value.trim();
    const amount = parseFloat(amountEl.value);
    const participants = MEMBERS.filter((_, i) => splitChecked[i]);

    if (!name) return alert('請輸入活動名稱');
    if (isNaN(amount)) return alert('請輸入有效金額');
    if (participants.length === 0) return alert('請至少選擇一位分攤成員');

    const dateValue = dateEl.value ? new Date(dateEl.value) : new Date();
    const formattedDate = `${dateValue.getFullYear()}-${(dateValue.getMonth() + 1).toString().padStart(2, '0')}-${dateValue.getDate().toString().padStart(2, '0')}`;

    const newSplit = {
      name,
      amount,
      currency: currEl.value as 'JPY' | 'TWD',
      payer: payerEl.value,
      participants,
      date: formattedDate,
      createdAt: new Date().toISOString(),
      userId: auth.currentUser?.uid || 'guest',
      order: Date.now()
    };

    try {
      await addDoc(collection(db, 'splitExpenses'), newSplit);
      nameEl.value = '';
      amountEl.value = '';
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'splitExpenses');
    }
  };

  const convert = (amount: number, from: 'JPY' | 'TWD', to: 'JPY' | 'TWD') => {
    if (from === to) return amount;
    return from === 'JPY' ? amount * JPY_TWD : amount / JPY_TWD;
  };

  const format = (amount: number, curr: 'JPY' | 'TWD') => {
    return `${curr === 'JPY' ? '¥' : '$'}${Math.round(amount).toLocaleString()}`;
  };

  const memberExpenses = expenses.filter(e => e.member === currentMember);
  const totalPersonal = memberExpenses.reduce((acc, e) => acc + convert(e.amount, e.currency, currency), 0);

  const stripYear = (dateStr: string) => {
    const parts = dateStr.split(/[/-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[1]}/${parts[2]}`;
      if (parts[2].length === 4) return `${parts[0]}/${parts[1]}`;
    }
    return dateStr;
  };

  const moveMemberExpense = async (id: string, direction: 'up' | 'down') => {
    const currentMemberExps = expenses.filter(e => e.member === currentMember);
    const index = currentMemberExps.findIndex(e => e.id === id);
    if (index === -1) return;
    
    let targetIndex = -1;
    if (direction === 'up' && index > 0) targetIndex = index - 1;
    else if (direction === 'down' && index < currentMemberExps.length - 1) targetIndex = index + 1;

    if (targetIndex !== -1) {
      const item1 = currentMemberExps[index];
      const item2 = currentMemberExps[targetIndex];
      
      // Swap order fields
      const tempOrder = item1.order || Date.now();
      const newOrder1 = item2.order || Date.now();
      const newOrder2 = tempOrder;

      try {
        const { updateDoc } = await import('firebase/firestore');
        await Promise.all([
          updateDoc(doc(db, 'expenses', String(item1.id)), { order: newOrder1 }),
          updateDoc(doc(db, 'expenses', String(item2.id)), { order: newOrder2 })
        ]);
      } catch (error) {
        console.error("Order update failed:", error);
      }
    }
  };

  const moveSplitExpense = async (id: string, direction: 'up' | 'down') => {
    const index = splitExpenses.findIndex(e => e.id === id);
    if (index === -1) return;
    
    let targetIndex = -1;
    if (direction === 'up' && index > 0) targetIndex = index - 1;
    else if (direction === 'down' && index < splitExpenses.length - 1) targetIndex = index + 1;

    if (targetIndex !== -1) {
      const item1 = splitExpenses[index];
      const item2 = splitExpenses[targetIndex];
      
      const tempOrder = item1.order || Date.now();
      const newOrder1 = item2.order || Date.now();
      const newOrder2 = tempOrder;

      try {
        const { updateDoc } = await import('firebase/firestore');
        await Promise.all([
          updateDoc(doc(db, 'splitExpenses', String(item1.id)), { order: newOrder1 }),
          updateDoc(doc(db, 'splitExpenses', String(item2.id)), { order: newOrder2 })
        ]);
      } catch (error) {
        console.error("Order update failed:", error);
      }
    }
  };

  const updateMemberExpensesOrder = () => {
    // This is now handled by Firestore snapshots
  };

  const updateSplitOrder = () => {
    // This is now handled by Firestore snapshots
  };

  const getAnalyticsData = () => {
    const categoryTotals: Record<string, number> = {};
    memberExpenses.forEach(e => {
      const amt = convert(e.amount, e.currency, currency);
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + amt;
    });

    const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
    
    // Daily trend
    const dailyTotals: Record<string, number> = {};
    memberExpenses.forEach(e => {
      const amt = convert(e.amount, e.currency, currency);
      dailyTotals[e.date] = (dailyTotals[e.date] || 0) + amt;
    });
    const barData = Object.entries(dailyTotals)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, value]) => ({ name: stripYear(name), value }));

    return { pieData, barData };
  };

  const { pieData, barData } = getAnalyticsData();

  const CATEGORY_COLORS = [
    '#f59e0b', // food
    '#8b5cf6', // transportation
    '#10b981', // sight
    '#f43f5e', // shop
    '#d97706', // housing
    '#94a3b8', // other
  ];

  return (
    <div className="p-6 pb-24 space-y-12">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <JapaneseYen className="w-5 h-5 text-primary" />
            <h1 className="text-3xl font-black tracking-tighter uppercase text-zinc-800">
              支出管理
            </h1>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 tracking-[0.3em] uppercase pl-1">
            Budget Tracking
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-px w-4 bg-rose-200" />
            <p className="text-sm font-serif font-bold text-rose-500 tracking-wider">
              「日本是免稅，不是免費」
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-2">
        <div className="flex bg-surface border border-border p-1">
          <button 
            onClick={() => setTab('personal')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all",
              tab === 'personal' ? "bg-primary text-white shadow-lg" : "text-zinc-400"
            )}
          >
            <User className="w-3.5 h-3.5" /> 個人支出
          </button>
          <button 
            onClick={() => setTab('split')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all",
              tab === 'split' ? "bg-primary text-white shadow-lg" : "text-zinc-400"
            )}
          >
            <Users className="w-3.5 h-3.5" /> 團隊分帳
          </button>
        </div>
        
      </div>

      <AnimatePresence mode="wait">
        {tab === 'personal' ? (
          <div className="space-y-12">
            {/* Member Toggle - Always visible in Personal Tab */}
            <div className="flex flex-col gap-4">
              <span className="text-xs font-black tracking-[0.2em] uppercase text-zinc-400 border-l-2 border-primary pl-3">選擇成員</span>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {MEMBERS.map((m, i) => {
                  return (
                    <button
                      key={m}
                      onClick={() => setCurrentMember(i)}
                      style={{ 
                        backgroundColor: currentMember === i ? MEMBER_COLORS[i] : undefined,
                        borderColor: currentMember === i ? MEMBER_COLORS[i] : undefined,
                        color: currentMember === i ? 'white' : undefined 
                      }}
                      className={cn(
                        "flex-shrink-0 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] border transition-all flex items-center gap-2",
                        currentMember !== i && "bg-surface border-border text-zinc-400"
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <motion.div
                key="personal"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-12"
              >
                {/* Form moved inside the content block, Member Toggle moved out */}
                <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center py-6 border border-border bg-surface font-black uppercase tracking-widest cursor-pointer group shadow-sm hover:bg-white transition-all gap-2 relative overflow-hidden"
              >
                {isScanning && (
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="absolute top-0 left-0 w-full h-1 bg-primary/20"
                  />
                )}
                
                {isScanning ? (
                  <div className="flex flex-col items-center gap-2 text-primary">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-[10px] animate-pulse">AI 正在解析日本收據...</span>
                  </div>
                ) : scanStatus === 'success' ? (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-[10px]">辨識完成！</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-zinc-400 group-hover:text-primary transition-colors">
                      <Camera className="w-5 h-5" />
                      <span className="text-xs">智能辨識收據</span>
                    </div>
                    <span className="text-[8px] text-zinc-300 font-bold tracking-[0.2em]">FAST SCAN // GEMINI AI 1.5 FLASH</span>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={(e) => handleScan(e, false)} className="hidden" accept="image/*" />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    type="text" 
                    placeholder="項目 / 店家" 
                    className="bg-surface border border-border px-4 py-4 text-sm font-black uppercase tracking-widest outline-none focus:border-primary transition-colors placeholder:text-zinc-300 text-zinc-800" 
                  />
                  <input 
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    type="date" 
                    className="bg-surface border border-border px-4 py-4 text-xs font-black uppercase tracking-widest text-zinc-800 outline-none focus:border-primary" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 pl-1">總金額</label>
                    <input 
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      type="number" 
                      inputMode="decimal" 
                      placeholder="總金額" 
                      className="w-full bg-surface border border-border px-4 py-4 text-sm font-black uppercase tracking-widest outline-none focus:border-primary text-zinc-800 placeholder:text-zinc-300" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 pl-1">已稅金額</label>
                    <input 
                      value={formData.preTaxAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, preTaxAmount: e.target.value }))}
                      type="number" 
                      inputMode="decimal" 
                      placeholder="已稅金額" 
                      className="w-full bg-surface border border-border px-4 py-4 text-sm font-black uppercase tracking-widest outline-none focus:border-primary text-zinc-800 placeholder:text-zinc-300" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select 
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as 'JPY' | 'TWD' }))}
                    className="bg-surface border border-border px-4 py-4 text-xs font-black uppercase tracking-widest text-zinc-800 outline-none focus:border-primary"
                  >
                    <option value="JPY">JPY ¥</option>
                    <option value="TWD">TWD $</option>
                  </select>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="bg-surface border border-border px-4 py-4 text-xs font-black uppercase tracking-widest outline-none focus:border-primary text-zinc-800"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <AnimatePresence>
                  {formData.items.length > 0 && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-bg-dark border border-dashed border-border p-4 rounded-lg"
                    >
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2"><List className="w-3 h-3" /> 辨識出的明細與翻譯</div>
                        <button 
                          onClick={() => setFormData(p => ({ ...p, items: [...p.items, { name: '手動新增', translatedName: '手動新增', price: 0 }] }))}
                          className="flex items-center gap-1 text-[9px] text-primary hover:underline font-black"
                        >
                          <Plus className="w-2.5 h-2.5" /> 新增項
                        </button>
                      </div>
                      <div className="space-y-2">
                        {formData.items.map((item, idx) => (
                          <motion.div 
                            key={item.name + idx} 
                            layout
                            className="flex justify-between items-center group bg-white/50 p-2 rounded border border-transparent hover:border-primary/20 transition-all"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex flex-col gap-0.5 items-center justify-center border-r border-border/30 pr-2 mr-1">
                                <button 
                                  onClick={() => {
                                    if (idx === 0) return;
                                    const next = [...formData.items];
                                    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                    setFormData(p => ({ ...p, items: next }));
                                  }}
                                  disabled={idx === 0}
                                  className="p-0.5 hover:text-primary text-zinc-400 disabled:opacity-10 transition-colors"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (idx === formData.items.length - 1) return;
                                    const next = [...formData.items];
                                    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                                    setFormData(p => ({ ...p, items: next }));
                                  }}
                                  disabled={idx === formData.items.length - 1}
                                  className="p-0.5 hover:text-primary text-zinc-400 disabled:opacity-10 transition-colors"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex flex-col flex-1 pl-1">
                                <input 
                                  value={item.translatedName || item.name}
                                  onChange={(e) => {
                                    const next = [...formData.items];
                                    next[idx] = { ...next[idx], translatedName: e.target.value };
                                    setFormData(p => ({ ...p, items: next }));
                                  }}
                                  className="text-xs font-bold text-zinc-800 bg-transparent outline-none focus:text-primary"
                                />
                                <span className="text-[8px] text-zinc-400 font-medium">{item.name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <input 
                                type="number"
                                value={item.price}
                                onChange={(e) => {
                                  const next = [...formData.items];
                                  next[idx] = { ...next[idx], price: parseFloat(e.target.value) || 0 };
                                  setFormData(p => ({ ...p, items: next }));
                                }}
                                className="text-xs font-black font-mono text-zinc-500 bg-transparent w-16 text-right outline-none focus:text-primary"
                              />
                              <button 
                                onClick={() => setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))}
                                className="text-zinc-300 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={addExpense} 
                  className="w-full py-5 text-sm font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all text-white bg-primary"
                >
                  登記支出
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <div className="flex flex-col">
                  <h3 className="text-lg font-black tracking-tighter uppercase text-zinc-800">{MEMBERS[currentMember]} 的帳本</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 tracking-wider">合計: {expenses.length} 筆資料</span>
                    {isMigrating && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['JPY', 'TWD'] as const).map(c => (
                    <button 
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={cn(
                        "text-xs font-black px-3 py-1 uppercase tracking-widest transition-all",
                        currency === c ? "bg-primary text-white" : "text-zinc-400 hover:text-zinc-600"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-surface text-zinc-900 p-8 text-center flex flex-col items-center border border-border shadow-sm">
                <span className="text-xs font-bold uppercase tracking-[0.3em] mb-2 text-zinc-400">個人累計支出 // {currency}</span>
                <div 
                  className="text-6xl font-black tracking-tighter"
                  style={{ color: MEMBER_COLORS[currentMember] }}
                >
                  {format(totalPersonal, currency)}
                </div>
                
                <button 
                  onClick={() => setShowAnalytics(true)}
                  className="mt-6 flex items-center gap-2 px-6 py-2 border border-border hover:bg-zinc-50 transition-colors text-[10px] font-black uppercase tracking-widest text-zinc-600 shadow-sm"
                >
                  <PieChart className="w-3 h-3 text-primary" /> 消費分析
                </button>
              </div>

              <div className="space-y-4">
                {memberExpenses.length === 0 ? (
                  <div className="text-center py-12 text-zinc-300 text-xs font-black uppercase tracking-widest">查無交易紀錄</div>
                ) : (
                  memberExpenses.map((e, idx) => (
                    <motion.div 
                      key={e.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 items-center group py-4 border-b border-border/50 bg-bg-dark"
                    >
                      <div className="flex flex-col gap-1 items-center justify-center border-r border-border/30 pr-3 mr-1">
                        <button 
                          onClick={() => moveMemberExpense(String(e.id), 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:text-primary text-zinc-400 disabled:opacity-10 transition-colors"
                        >
                          <ChevronUp className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => moveMemberExpense(String(e.id), 'down')}
                          disabled={idx === memberExpenses.length - 1}
                          className="p-1 hover:text-primary text-zinc-400 disabled:opacity-10 transition-colors"
                        >
                          <ChevronDown className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 vertical-text origin-center -rotate-90 w-4">{stripYear(e.date)}</div>
                      <div className="flex-1">
                        <div className={cn(
                          "text-xs font-black uppercase tracking-[0.2em] mb-1",
                          e.category.includes('餐飲') ? 'text-orange-500' :
                          e.category.includes('交通') ? 'text-violet-500' :
                          e.category.includes('景點') ? 'text-emerald-500' :
                          e.category.includes('購物') ? 'text-rose-500' :
                          e.category.includes('住宿') ? 'text-amber-600' : 'text-zinc-400'
                        )}>{e.category}</div>
                        <div className="text-base font-black tracking-tight uppercase text-zinc-800">{e.name}</div>
                        {e.store && e.store !== e.name && <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{e.store}</div>}
                        
                        {(e.preTaxAmount || (e.items && e.items.length > 0)) && (
                          <div className="mt-2 text-[10px] font-bold uppercase overflow-hidden">
                            <div className="flex gap-4 mb-1">
                              {e.preTaxAmount && <span className="text-zinc-500">已稅: {format(e.preTaxAmount, e.currency)}</span>}
                              <button 
                                onClick={() => setShowItemsFor(showItemsFor === e.id ? null : e.id)}
                                className="text-primary hover:underline transition-colors"
                              >
                                {showItemsFor === e.id ? '隱藏明細' : `顯示 ${e.items?.length || 0} 項明細`}
                              </button>
                            </div>
                            <AnimatePresence>
                              {showItemsFor === e.id && e.items && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="mt-2 space-y-1 pl-2 border-l-2 border-primary/20"
                                >
                                  {e.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start py-1 border-b border-zinc-100 last:border-0">
                                      <div className="flex flex-col">
                                        <span className="text-zinc-600">{item.translatedName || item.name}</span>
                                        <span className="text-[8px] text-zinc-400 leading-none">{item.name}</span>
                                      </div>
                                      <span className="text-zinc-400 font-mono">{format(item.price, e.currency)}</span>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                        <div className="text-right flex items-center gap-4">
                          <div className="text-base font-black font-mono text-zinc-800">{format(convert(e.amount, e.currency, currency), currency)}</div>
                          <button 
                            onClick={async () => {
                              try {
                                await deleteDoc(doc(db, 'expenses', String(e.id)));
                              } catch (error) {
                                handleFirestoreError(error, OperationType.DELETE, `expenses/${e.id}`);
                              }
                            }} 
                            className="text-zinc-300 hover:text-primary transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
      </div>
    ) : (
          <motion.div
            key="split"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-12"
          >
            {/* Split Form */}
            <div className="space-y-10">
              <div 
                onClick={() => splitFileInputRef.current?.click()}
                className="flex flex-col items-center justify-center py-6 border border-border bg-surface font-black uppercase tracking-widest cursor-pointer group shadow-sm hover:bg-white transition-all gap-2 relative overflow-hidden"
              >
                {isScanning && (
                   <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="absolute top-0 left-0 w-full h-1 bg-emerald-600/20"
                  />
                )}
                <div className="flex items-center gap-3 text-zinc-400 group-hover:text-emerald-600 transition-colors">
                  <Camera className="w-5 h-5" />
                  <span className="text-xs">掃描團體帳單 / 收據</span>
                </div>
                <input type="file" ref={splitFileInputRef} onChange={(e) => handleScan(e, true)} className="hidden" accept="image/*" />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input id="splitName" type="text" placeholder="活動名稱" className="bg-surface border border-border px-4 py-4 text-sm font-black uppercase tracking-widest outline-none focus:border-primary text-zinc-800 placeholder:text-zinc-300" />
                  <input id="splitDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-surface border border-border px-4 py-4 text-xs font-black uppercase tracking-widest text-zinc-800 outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input id="splitAmount" type="number" inputMode="decimal" placeholder="總費用" className="bg-surface border border-border px-4 py-4 text-sm font-black uppercase tracking-widest outline-none focus:border-primary text-zinc-800 placeholder:text-zinc-300" />
                  <select id="splitCurrency" className="bg-surface border border-border px-4 py-4 text-xs font-black uppercase tracking-widest text-zinc-800 outline-none focus:border-primary">
                    <option value="JPY">JPY ¥</option>
                    <option value="TWD">TWD $</option>
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-black tracking-[0.2em] uppercase text-zinc-400 border-l-2 border-primary pl-3">付款人</label>
                  <select id="splitPayer" className="w-full bg-surface border border-border px-4 py-4 text-xs font-black uppercase tracking-widest outline-none focus:border-primary text-zinc-800">
                    {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black tracking-[0.2em] uppercase text-zinc-400 border-l-2 border-primary pl-3">分攤成員</label>
                  <div className="flex flex-wrap gap-2">
                    {MEMBERS.map((m, i) => (
                      <button
                        key={m+'check'}
                        onClick={() => {
                          const next = [...splitChecked];
                          next[i] = !next[i];
                          setSplitChecked(next);
                        }}
                        className={cn(
                          "px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-all border",
                          splitChecked[i] ? "bg-emerald-600 text-white border-emerald-600" : "bg-surface border-border text-zinc-400"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={addSplitExpense} 
                  className="w-full py-5 text-sm font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-white bg-emerald-600"
                >
                  儲存活動支出
                </button>
              </div>
            </div>

            {/* Split Results */}
            <div className="space-y-10">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <h3 className="text-lg font-black tracking-tighter uppercase text-zinc-800">結算報告</h3>
                <div className="flex gap-2">
                  {(['JPY', 'TWD'] as const).map(c => (
                    <button 
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={cn(
                        "text-xs font-black px-3 py-1 uppercase tracking-widest transition-all",
                        currency === c ? "bg-primary text-white" : "text-zinc-400 hover:text-zinc-600"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Balances */}
              {(() => {
                const currentBalances = MEMBERS.reduce((acc, m) => {
                  let bal = 0;
                  splitExpenses.forEach(se => {
                    const disp = convert(se.amount, se.currency, currency);
                    const per = disp / se.participants.length;
                    if (se.payer === m) bal += disp;
                    if (se.participants.includes(m)) bal -= per;
                  });
                  acc[m] = bal;
                  return acc;
                }, {} as Record<string, number>);

                const settlements = (() => {
                  const dWork = Object.entries(currentBalances)
                    .filter(([_, b]) => b < -0.9)
                    .map(([n, b]) => ({ n, b: Math.abs(b) }))
                    .sort((a, b) => b.b - a.b);
                  const cWork = Object.entries(currentBalances)
                    .filter(([_, b]) => b > 0.9)
                    .map(([n, b]) => ({ n, b }))
                    .sort((a, b) => b.b - a.b);
                  
                  const res: { from: string; to: string; amount: number }[] = [];
                  let d = 0, c = 0;
                  while (d < dWork.length && c < cWork.length) {
                    const amt = Math.min(dWork[d].b, cWork[c].b);
                    res.push({ from: dWork[d].n, to: cWork[c].n, amount: amt });
                    dWork[d].b -= amt;
                    cWork[c].b -= amt;
                    if (dWork[d].b < 0.9) d++;
                    if (cWork[c].b < 0.9) c++;
                  }
                  return res;
                })();

                const totalGroupExpense = splitExpenses.reduce((acc, se) => acc + convert(se.amount, se.currency, currency), 0);

                return (
                  <div className="space-y-10">
                    <div className="grid grid-cols-2 gap-px bg-border border border-border overflow-hidden shadow-sm">
                      {MEMBERS.map(m => {
                        const balance = currentBalances[m];
                        return (
                          <div key={m+'balance'} className="bg-surface p-6 flex flex-col items-center">
                            <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">{m}</div>
                            <div className={cn("text-2xl font-black tracking-tighter", balance >= 0 ? "text-emerald-500" : "text-rose-500")}>
                              {balance >= 0 ? '+' : ''}{Math.round(balance).toLocaleString()}
                              <span className="text-[10px] ml-1 opacity-50">{currency}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Settlement Plan */}
                    {(settlements.length > 0 || totalGroupExpense > 0) && (
                      <div className="bg-zinc-50 border border-border p-8 space-y-6">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 border-l-2 border-primary pl-3">結算建議方案</h4>
                            <p className="text-[10px] font-bold text-zinc-300 tracking-wider">根據目前累計支出計算的最簡化還款路徑</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">團體總支出</span>
                            <span className="text-xl font-black font-mono text-zinc-800">{format(totalGroupExpense, currency)}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {settlements.length > 0 ? (
                            settlements.map((s, i) => (
                              <div key={i} className="flex items-center justify-between bg-white border border-border p-4 shadow-sm group">
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">支付人</span>
                                    <div className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-black border border-rose-100 uppercase">{s.from}</div>
                                  </div>
                                  <ArrowRightLeft className="w-4 h-4 text-zinc-200 group-hover:text-primary transition-colors" />
                                  <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">收款人</span>
                                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-black border border-emerald-100 uppercase">{s.to}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest block mb-1">應付金額</span>
                                  <div className="text-lg font-black font-mono text-zinc-800">{format(s.amount, currency)}</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-[10px] font-black uppercase tracking-widest text-zinc-300 bg-white border border-dashed border-border">暫時無需結算</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Transactions */}
              <div className="flex flex-col">
                <div className="text-[10px] font-bold text-zinc-400 tracking-wider mb-2">使用上下按鈕可調整順序</div>
                <div className="space-y-px bg-border border border-border shadow-sm">
                  {splitExpenses.map((se, idx) => (
                    <motion.div 
                      key={se.id} 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-surface p-6 flex flex-col gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1 items-center justify-center border-r border-border/30 pr-4 mr-2">
                          <button 
                            onClick={() => moveSplitExpense(String(se.id), 'up')}
                            disabled={idx === 0}
                            className="p-1 hover:text-emerald-600 text-zinc-400 disabled:opacity-10 transition-colors"
                          >
                            <ChevronUp className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => moveSplitExpense(String(se.id), 'down')}
                            disabled={idx === splitExpenses.length - 1}
                            className="p-1 hover:text-emerald-600 text-zinc-400 disabled:opacity-10 transition-colors"
                          >
                            <ChevronDown className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">{stripYear(se.date)} // 由 {se.payer} 付款</div>
                          <div className="text-xl font-black tracking-tight uppercase leading-none text-zinc-800">{se.name}</div>
                        </div>
                        <div className="text-right flex items-center gap-6">
                          <div className="text-2xl font-black text-zinc-800">{format(se.amount, se.currency)}</div>
                          <button 
                            onClick={async () => {
                              try {
                                await deleteDoc(doc(db, 'splitExpenses', String(se.id)));
                              } catch (error) {
                                handleFirestoreError(error, OperationType.DELETE, `splitExpenses/${se.id}`);
                              }
                            }} 
                            className="text-zinc-300 hover:text-rose-500"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-8">
                        {se.participants.map(p => (
                          <span key={p} className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border border-border text-zinc-400">
                            {p}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Modal */}
      <AnimatePresence>
        {showAnalytics && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAnalytics(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white border-2 border-zinc-800 shadow-2xl p-6 overflow-y-auto max-h-[80vh]"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-800">消費分析</h2>
                  <p className="text-[10px] font-bold text-zinc-400 tracking-[0.2em] uppercase">{MEMBERS[currentMember]} // {currency}</p>
                </div>
                <button onClick={() => setShowAnalytics(false)} className="p-2 hover:bg-zinc-100 transition-colors">
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>

                <div className="space-y-6">
                  <div className="text-xs font-black uppercase tracking-widest text-zinc-400 border-l-2 border-primary pl-2">各項類別佔比</div>
                  <div className="space-y-4">
                    {pieData.length > 0 ? (
                      pieData.map((item, idx) => {
                        const totalValue = pieData.reduce((acc, curr) => acc + curr.value, 0);
                        const percentage = ((item.value / totalValue) * 100).toFixed(1);
                        return (
                          <div key={item.name} className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                                <span className="text-sm font-black text-zinc-800">{item.name}</span>
                              </div>
                              <div className="text-right flex items-baseline gap-2">
                                <span className="text-xs font-bold text-zinc-400">{percentage}%</span>
                                <span className="text-base font-black font-mono text-zinc-900">{format(item.value, currency)}</span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-100 overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                className="h-full"
                                style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-20 text-xs font-black uppercase tracking-widest text-zinc-300">暫無數據</div>
                    )}
                  </div>
                </div>

              <button 
                onClick={() => setShowAnalytics(false)}
                className="w-full mt-12 bg-zinc-900 text-white py-4 text-xs font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
              >
                關閉分析
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
