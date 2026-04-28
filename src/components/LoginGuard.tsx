import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, KeyRound, Loader2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';

const INVITE_CODE = "KARINA";

export function LoginGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('invite_code_auth');
    if (stored === INVITE_CODE) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const submittedCode = code.trim().toUpperCase();
    if (submittedCode === INVITE_CODE) {
      localStorage.setItem('invite_code_auth', INVITE_CODE);
      setIsAuthenticated(true);
    } else {
      setError("無效的邀請碼");
    }
    setIsLoading(false);
  };

  if (isAuthenticated === null || (isAuthenticated && isLoading)) {
    return (
      <div className="fixed inset-0 bg-bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="fixed inset-0 bg-bg-dark z-[100] flex items-center justify-center p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white border-2 border-zinc-900 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8"
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 bg-primary flex items-center justify-center border-2 border-zinc-900 rotate-3">
            <Lock className="w-10 h-10 text-white -rotate-3" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">受限區域</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] font-sans">Restricted Access // Osaka 2026</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">請輸入邀請碼</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-900" />
              <input 
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="INVITATION CODE"
                className="w-full pl-14 pr-4 py-5 bg-zinc-50 border-2 border-zinc-900 font-black uppercase tracking-[0.2em] outline-none focus:bg-white focus:border-primary transition-all text-lg"
                autoFocus
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border-2 border-red-500 p-3 text-[10px] font-black text-red-600 uppercase tracking-widest text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-zinc-900 text-white py-5 font-black uppercase tracking-[0.3em] hover:bg-zinc-800 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
          >
            {isLoading ? "驗證中..." : "驗證邀請碼"}
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-100 flex flex-col items-center gap-2">
          <p className="text-[9px] font-bold text-zinc-400 text-center uppercase tracking-widest leading-relaxed">
            此應用程式僅供受邀人員使用<br />若您遺失邀請碼，請聯繫管理員
          </p>
        </div>
      </motion.div>
    </div>
  );
}
