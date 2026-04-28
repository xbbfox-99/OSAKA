import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cloud, MapPin, Navigation, BookOpen, Loader2 } from 'lucide-react';
import { DAYS } from '../constants';
import { cn } from '../lib/utils';
import { Tag as TagType } from '../types';

interface ItineraryViewProps {
  onOpenGuide: (title: string, query: string) => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({ onOpenGuide }) => {
  const [currentDay, setCurrentDay] = useState(0);
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const dayData = DAYS[currentDay];

  useEffect(() => {
    async function fetchWeather() {
      setWeatherLoading(true);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${dayData.lat}&longitude=${dayData.lon}&current=temperature_2m,weathercode,relative_humidity_2m,wind_speed_10m&timezone=Asia/Tokyo&forecast_days=1`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setWeather(data.current);
      } catch (e: any) {
        if (e.message.includes('Failed to fetch')) {
          console.warn("Weather fetch failed (likely transient network issue)");
        } else {
          console.error("Weather fetch Error:", e);
        }
        setWeather(null); // Ensure null state so we can show a "retry" or "not available" state if needed
      } finally {
        setWeatherLoading(false);
      }
    }
    fetchWeather();
  }, [currentDay, dayData.lat, dayData.lon]);

  const weatherCodeInfo = (code: number) => {
    if (code === 0) return { icon: '☀️', desc: '晴天' };
    if (code <= 2) return { icon: '🌤️', desc: '多雲時晴' };
    if (code <= 3) return { icon: '☁️', desc: '陰天' };
    if (code <= 48) return { icon: '🌫️', desc: '有霧' };
    if (code <= 67) return { icon: '🌧️', desc: '下雨' };
    if (code <= 99) return { icon: '⛈️', desc: '雷陣雨' };
    return { icon: '🌤️', desc: '晴朗' };
  };

  return (
    <div className="p-6 pb-24 space-y-8">
      {/* Day Selector */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
        {DAYS.map((day, i) => (
          <button
            key={i}
            onClick={() => setCurrentDay(i)}
            className={cn(
              "flex-shrink-0 px-6 py-2.5 rounded-none border-t-2 transition-all text-[11px] font-bold tracking-[0.2em] uppercase",
              currentDay === i 
                ? "border-orange-500 text-orange-600 bg-orange-50" 
                : "border-border text-zinc-400 hover:text-zinc-600"
            )}
          >
            DAY {i < 9 ? `0${i+1}` : i+1}
          </button>
        ))}
      </div>

      {/* Weather & Day Title */}
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline gap-4">
          <span className="text-7xl font-black text-orange-500 leading-none">{currentDay < 9 ? `0${currentDay+1}` : currentDay+1}</span>
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold tracking-tight uppercase leading-none text-zinc-900">{dayData.title}</h2>
            <span className="text-[10px] font-mono text-zinc-400 mt-1 uppercase tracking-[0.2em]">{dayData.loc} // 日本</span>
          </div>
        </div>

        <motion.div 
          key={`weather-${currentDay}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6 py-4 border-y border-border"
        >
          {weatherLoading ? (
            <div className="flex items-center gap-3 text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              正在更新天氣數據...
            </div>
          ) : weather ? (
            <div className="flex items-center gap-8 w-full justify-between">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                   <span className="text-4xl font-bold tracking-tighter text-zinc-900">{Math.round(weather.temperature_2m)}°</span>
                   <div className="h-0.5 w-full bg-accent-gold/40 mt-1" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent-sage mb-0.5">{weatherCodeInfo(weather.weathercode).desc}</span>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">濕度: {weather.relative_humidity_2m}% // 風速: {weather.wind_speed_10m}km/h</span>
                </div>
              </div>
              <div className="text-4xl drop-shadow-sm">{weatherCodeInfo(weather.weathercode).icon}</div>
            </div>
          ) : null}
        </motion.div>
      </div>

      {/* Timeline */}
      <div className="space-y-12 relative pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`day-${currentDay}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-10"
          >
            {dayData.items.map((item, idx) => (
              <TimelineItem 
                key={idx} 
                item={item} 
                isLast={idx === dayData.items.length - 1} 
                onOpenGuide={onOpenGuide}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const TimelineItem: React.FC<{ item: any; isLast: boolean; onOpenGuide: (t: string, q: string) => void }> = ({ item, isLast, onOpenGuide }) => {
  return (
    <div className="flex flex-col gap-4 relative">
        <div className="flex items-center gap-4">
        <div className="text-[11px] font-bold text-orange-600 tracking-[0.1em] uppercase bg-orange-50 border border-orange-100 px-3 py-1">{item.time}</div>
        <div className="h-[1px] flex-1 bg-border/60" />
      </div>
      
      <div className="pl-2 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 leading-tight mb-2 uppercase">{item.title}</h3>
            {item.body && <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-3">{item.body}</p>}
          </div>
          <div className="text-2xl mt-1 opacity-100">{item.icon}</div>
        </div>
        
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag: TagType, i: number) => {
              const colorClass = 
                tag.type === 'price' ? 'border-amber-400/30 text-amber-600 bg-amber-50' :
                tag.type === 'booking' ? 'border-rose-400/30 text-rose-600 bg-rose-50' :
                tag.type === 'food' ? 'border-emerald-400/30 text-emerald-600 bg-emerald-50' :
                'border-border text-zinc-400 bg-surface';
              
              return (
                <span 
                  key={i} 
                  className={cn("text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 border transition-all", colorClass)}
                >
                  {tag.text}
                </span>
              );
            })}
          </div>
        )}

        {(item.map || item.guide) && (
          <div className="flex gap-3 pt-2">
            {item.map && (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.map)}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-primary transition-colors"
              >
                <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                  <Navigation className="w-2.5 h-2.5" />
                </div>
                開啟地圖
              </a>
            )}
            {item.guide && (
              <button 
                onClick={() => onOpenGuide(item.title, item.guide)}
                className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-primary transition-colors"
              >
                <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                  <BookOpen className="w-2.5 h-2.5" />
                </div>
                專家指南
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
