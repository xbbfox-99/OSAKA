/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ItineraryView } from './components/ItineraryView';
import { InfoView } from './components/InfoView';
import { BudgetView } from './components/BudgetView';
import { GuideModal } from './components/GuideModal';
import { LoginGuard } from './components/LoginGuard';

type Tab = 'itinerary' | 'info' | 'budget';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('itinerary');
  const [guideState, setGuideState] = useState<{ isOpen: boolean; title: string; query: string }>({
    isOpen: false,
    title: '',
    query: ''
  });

  const openGuide = (title: string, query: string) => {
    setGuideState({ isOpen: true, title, query });
  };

  const closeGuide = () => {
    setGuideState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <LoginGuard>
      <div className="flex flex-col min-h-screen bg-bg-dark text-zinc-800 font-sans selection:bg-primary selection:text-white">
        <Header />
        
        <main className="flex-1 max-w-lg mx-auto w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'itinerary' && <ItineraryView onOpenGuide={openGuide} />}
              {activeTab === 'info' && <InfoView />}
              {activeTab === 'budget' && <BudgetView />}
            </motion.div>
          </AnimatePresence>
        </main>

        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <GuideModal 
          isOpen={guideState.isOpen} 
          onClose={closeGuide} 
          title={guideState.title} 
          query={guideState.query} 
        />

        {/* Global Grain/Noise Overlay for "Bold" aesthetic */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-[9999]" />
      </div>
    </LoginGuard>
  );
}

