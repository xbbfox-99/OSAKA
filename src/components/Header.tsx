import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="relative pt-6 pb-4 px-6 bg-[#A6301A] border-b border-black/10 overflow-hidden">
      <div className="flex flex-col text-left">
        <span className="text-white/70 font-mono text-[9px] tracking-[0.3em] uppercase mb-1 font-bold flex items-center gap-2">
          <div className="w-6 h-[1px] bg-white/40" />
          旅遊行程 // 大阪・京都 2026
        </span>
        <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tighter uppercase mb-2 text-white">
          OSAKA <span className="text-white/20">2026</span>
        </h1>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 mt-1">
        <div className="text-lg font-light italic text-white/80">5月03日 — 5月09日</div>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 border border-white/20 rounded-full text-[8px] uppercase tracking-widest bg-white/10 font-bold text-white">春季版</span>
          <span className="px-2 py-0.5 border border-white/20 rounded-full text-[8px] uppercase tracking-widest bg-white/10 font-bold text-white">7 天</span>
        </div>
      </div>

      {/* Decorative Background Text */}
      <div className="absolute -bottom-4 -right-4 opacity-[0.08] text-[120px] font-black leading-none pointer-events-none select-none text-white">
        JP
      </div>
    </header>
  );
};
