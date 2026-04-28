import React from 'react';
import { Calendar, Info, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface NavProps {
  activeTab: 'itinerary' | 'info' | 'budget';
  setActiveTab: (tab: 'itinerary' | 'info' | 'budget') => void;
}

export const Navigation: React.FC<NavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'itinerary', label: '行程', icon: Calendar },
    { id: 'info', label: '資訊', icon: Info },
    { id: 'budget', label: '預算', icon: Wallet },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-dark/80 backdrop-blur-lg border-t border-border flex z-50 pb-[env(safe-area-inset-bottom,0px)] px-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-4 transition-all relative overflow-hidden",
            activeTab === tab.id ? "text-primary" : "text-zinc-400"
          )}
        >
          {activeTab === tab.id && (
            <motion.div 
              layoutId="nav-glow"
              className="absolute inset-0 bg-primary/10 blur-xl"
            />
          )}
          <tab.icon className={cn("w-5 h-5 mb-1.5 transition-transform", activeTab === tab.id && "scale-110")} />
          <span className="text-[9px] font-black tracking-[0.2em]">{tab.label}</span>
          
          {activeTab === tab.id && (
            <motion.div 
              layoutId="nav-underline"
              className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(255,59,48,0.5)]"
            />
          )}
        </button>
      ))}
    </nav>
  );
};
