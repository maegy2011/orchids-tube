"use client";

import React from 'react';
import { useWellBeing } from '@/lib/well-being-context';
import { useI18n } from '@/lib/i18n-context';
import { motion } from 'framer-motion';
import { Timer, Moon, ShieldCheck } from 'lucide-react';

export function WellBeingGuard({ children }: { children: React.ReactNode }) {
  const { 
    isLimitReached, 
    isBedtime, 
  } = useWellBeing();
  const { t } = useI18n();

  const activeLimit = isLimitReached ? 'time' : isBedtime ? 'bedtime' : null;

  if (!activeLimit) return <>{children}</>;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6"
        >
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              {activeLimit === 'time' ? (
                <Timer className="w-12 h-12 text-primary" />
              ) : (
                <Moon className="w-12 h-12 text-primary" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {activeLimit === 'time' ? t('dailyLimitReached') || "Daily Limit Reached" : t('bedtimeModeActive') || "Bedtime Mode Active"}
            </h2>
            <p className="text-muted-foreground">
              {activeLimit === 'time' 
                ? t('timeToRest') || "You've reached your daily watch limit. Time to take a break and rest your eyes."
                : t('goodNightReminder') || "It's bedtime! Sleep is important for your health and growth."}
            </p>
          </div>

          <div className="pt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{t('digitalWellbeing') || "Digital Well-being"}</span>
            </div>
            <div className="w-1 h-1 bg-border rounded-full" />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </motion.div>
      </div>
      <div className="fixed inset-0 pointer-events-none opacity-20 filter grayscale blur-sm">
        {children}
      </div>
    </>
  );
}
