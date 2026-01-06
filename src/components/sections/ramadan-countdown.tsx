"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Star, X, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { useTheme } from "next-themes";

export default function RamadanCountdown() {
  const { t, direction, showRamadanCountdown, setShowRamadanCountdown } = useI18n();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { theme, resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const calculateDaysLeft = () => {
      const now = new Date();
      
      const ramadanDates = [
        new Date("2025-03-01T00:00:00"),
        new Date("2026-02-18T00:00:00"),
        new Date("2027-02-08T00:00:00"),
      ];

      const nextRamadan = ramadanDates.find(date => date > now);
      
      if (nextRamadan) {
        const diffTime = nextRamadan.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysLeft(diffDays);
      }
    };

    calculateDaysLeft();
    const interval = setInterval(calculateDaysLeft, 3600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showRamadanCountdown && daysLeft !== null && daysLeft > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [showRamadanCountdown, daysLeft]);

  if (!isVisible || daysLeft === null) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-0 left-0 w-full h-[40px] sm:h-[36px] overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-emerald-50 z-[6000] border-b border-emerald-500/20 shadow-lg flex items-center"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(255,226,104,0.15),transparent_50%)]" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_50%,rgba(255,226,104,0.15),transparent_50%)]" />
        </div>

        {/* Floating Ramadan Icons Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.1, 0.4, 0.1],
                y: [0, -5, 0],
                rotate: [0, 10, 0]
              }}
              transition={{ 
                duration: 5 + i, 
                repeat: Infinity,
                delay: i * 1.2 
              }}
              className="absolute text-yellow-300/30"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            >
              {i % 2 === 0 ? <Star size={10} fill="currentColor" /> : <Sparkles size={8} />}
            </motion.div>
          ))}
        </div>

        <div className="w-full px-4 relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <motion.div 
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="bg-yellow-400/20 p-1 rounded-lg border border-yellow-400/30 shrink-0"
            >
              <Moon className="w-4 h-4 text-yellow-300 fill-yellow-300/40" />
            </motion.div>
            
            <div className="flex items-center gap-3 whitespace-nowrap">
              <span className="font-bold text-sm sm:text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-yellow-100 to-yellow-400">
                {t('ramadanKareem')}
              </span>
              <span className="h-4 w-[1px] bg-emerald-500/30 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-800/60 backdrop-blur-sm px-2 py-0.5 rounded-md border border-emerald-500/30 text-[10px] sm:text-xs font-bold text-yellow-100 shadow-inner">
                  {daysLeft} {t('daysUntilRamadan')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowRamadanCountdown(false)}
            className="group p-1.5 hover:bg-white/10 rounded-full transition-all duration-300 shrink-0"
            title={t('cancel')}
          >
            <X size={14} className="text-emerald-200 group-hover:text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Islamic Pattern Bottom Border */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[2px] opacity-30"
          style={{ 
            backgroundImage: `radial-gradient(circle, #fbbf24 1px, transparent 1px)`,
            backgroundSize: '12px 12px'
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
