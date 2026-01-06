"use client";

import React, { useState, useEffect } from 'react';
import { useWellBeing } from '@/lib/well-being-context';
import { useI18n } from '@/lib/i18n-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Timer, Moon, RefreshCcw, ShieldCheck } from 'lucide-react';

export function WellBeingGuard({ children }: { children: React.ReactNode }) {
    const { 
      isLimitReached, 
      isBedtime, 
      isShortsLimitReached,
      limits,
      checkPin,
      setParentalLocked,
      isParentalLocked,
      isGracePeriodActive
    } = useWellBeing();

  const { t, direction } = useI18n();
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const isRTL = direction === 'rtl';

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPin(pin)) {
      setParentalLocked(false);
      setShowPinEntry(false);
      setPin("");
      setError(false);
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 500);
    }
  };

    const activeLimit = (isLimitReached || isBedtime) && !isGracePeriodActive && isParentalLocked ? (isLimitReached ? 'time' : 'bedtime') : null;


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

          {!showPinEntry ? (
            <button 
              onClick={() => setShowPinEntry(true)}
              className="flex items-center justify-center gap-2 w-full py-4 bg-muted hover:bg-muted/80 rounded-2xl font-semibold transition-all"
            >
              <Lock className="w-5 h-5" />
              {t('parentalOverride') || "Parental Override"}
            </button>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-2 text-right">
                <label className="text-sm font-medium px-1">{t('enterParentalPin') || "Enter Parental PIN"}</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    autoFocus
                    className={`
                      w-full bg-muted border-none rounded-2xl px-4 py-4 text-center text-2xl tracking-[1em] font-mono focus:ring-2 focus:ring-primary outline-none transition-all
                      ${error ? 'ring-2 ring-destructive animate-shake' : ''}
                    `}
                    placeholder="****"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowPinEntry(false)}
                  className="flex-1 py-3 bg-muted rounded-xl font-medium"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20"
                >
                  {t('unlock') || "Unlock"}
                </button>
              </div>
            </form>
          )}

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
      {/* Background children are still mounted but covered */}
      <div className="fixed inset-0 pointer-events-none opacity-20 filter grayscale blur-sm">
        {children}
      </div>
    </>
  );
}
