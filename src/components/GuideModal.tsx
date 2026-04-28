import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, BookOpen, MapPin, Coffee, Info, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getDestinationGuideStream, getPreGeneratedGuide } from '../services/gemini';
import { cn } from '../lib/utils';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  query: string;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, title, query }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && query) {
      const cached = getPreGeneratedGuide(title, query);
      if (cached) {
        setContent(cached);
        setLoading(false);
        setError(false);
        return;
      }

      setContent('');
      setLoading(true);
      setError(false);
      
      getDestinationGuideStream(title, query, (chunk) => {
        if (isMounted) {
          setContent(prev => prev + chunk);
          setLoading(false);
        }
      }).catch(err => {
        console.error(err);
        if (isMounted) {
          setLoading(false);
          setError(true);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [isOpen, query, title, retryTrigger]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[101] bg-bg-dark border-t border-border rounded-none max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl"
          >
            <div className="sticky top-0 bg-bg-dark/80 backdrop-blur-md px-6 py-6 flex items-center justify-between border-b border-border z-10">
              <div className="flex flex-col">
                <span className="text-primary font-mono text-[9px] tracking-[0.2em] uppercase font-bold mb-1 flex items-center gap-2">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini 智慧 // 指南
                </span>
                <h2 className="text-2xl font-bold text-primary tracking-tight uppercase leading-none">{title}</h2>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 border border-border flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 pb-16">
              {loading && !content && (
                <div className="flex flex-col items-center justify-center py-24 gap-6 text-zinc-400">
                  <div className="w-12 h-1 bg-border overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary w-1/3 animate-[shimmer_1.5s_infinite]" />
                  </div>
                  <div className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">正在擷取旅遊數據...</div>
                </div>
              )}

              {error && !content && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <AlertTriangle className="w-10 h-10 text-rose-500 opacity-50" />
                  <div className="text-xs font-black uppercase tracking-widest text-zinc-500">暫時無法連線至導覽服務</div>
                  <button 
                    onClick={() => setRetryTrigger(prev => prev + 1)}
                    className="mt-2 px-6 py-3 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-[0.2em]"
                  >
                    重新嘗試
                  </button>
                </div>
              )}

              {(content || (loading && content)) && (
                <div className="space-y-12">
                  {/* Banner */}
                  <div className="h-1 bg-primary w-32" />

                  <div className="prose prose-zinc max-w-none">
                    <div className="markdown-body text-zinc-600 font-medium leading-relaxed tracking-tight uppercase text-sm">
                      <ReactMarkdown>{content}</ReactMarkdown>
                      {loading && content && (
                        <span className="inline-block w-2 h-4 bg-primary/40 animate-pulse ml-1 align-middle" />
                      )}
                    </div>
                  </div>

                  {!loading && (
                    <div className="grid grid-cols-2 gap-px bg-border border border-border mt-12 overflow-hidden shadow-sm">
                       <div className="bg-surface p-6 text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-3">
                         <div className="w-1.5 h-1.5 bg-primary/40" />
                         當地資訊已確認
                       </div>
                       <div className="bg-surface p-6 text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-3">
                         <div className="w-1.5 h-1.5 bg-primary/40" />
                         路線圖已生成
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
