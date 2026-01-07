"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from "sonner";
import { useI18n } from './i18n-context';

export interface WellBeingLimits {
  dailyTimeLimit: number; // minutes, 0 means no limit
  shortsDailyLimit: number; // count, 0 means no limit
  breakInterval: number; // minutes, 0 means no limit
  bedtimeStart: string; // HH:mm
  bedtimeEnd: string; // HH:mm
  bedtimeEnabled: boolean;
}

interface WellBeingContextType {
  dailyWatchTime: number;
  dailyShortsCount: number;
  continuousWatchTime: number;
  isBedtime: boolean;
  limits: WellBeingLimits;
  setLimits: (limits: WellBeingLimits) => void;
  incrementShortsCount: () => void;
  resetContinuousTime: () => void;
  isLimitReached: boolean;
  isShortsLimitReached: boolean;
}

const DEFAULT_LIMITS: WellBeingLimits = {
  dailyTimeLimit: 120, // 2 hours
  shortsDailyLimit: 20,
  breakInterval: 30, // 30 minutes
  bedtimeStart: "21:00",
  bedtimeEnd: "07:00",
  bedtimeEnabled: true,
};

const WellBeingContext = createContext<WellBeingContextType | undefined>(undefined);

export function WellBeingProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [dailyWatchTime, setDailyWatchTime] = useState(0);
  const [dailyShortsCount, setDailyShortsCount] = useState(0);
  const [continuousWatchTime, setContinuousWatchTime] = useState(0);
  const [limits, setLimitsState] = useState<WellBeingLimits>(DEFAULT_LIMITS);
  const [lastTrackedMinute, setLastTrackedMinute] = useState(new Date().getMinutes());

  // Load from localStorage
  useEffect(() => {
    const savedLimits = localStorage.getItem('wb-limits');
    if (savedLimits) setLimitsState(JSON.parse(savedLimits));

    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('wb-date');
    
    if (savedDate === today) {
      const savedTime = localStorage.getItem('wb-daily-time');
      if (savedTime) setDailyWatchTime(parseInt(savedTime, 10));
      
      const savedShorts = localStorage.getItem('wb-daily-shorts');
      if (savedShorts) setDailyShortsCount(parseInt(savedShorts, 10));
    } else {
      localStorage.setItem('wb-date', today);
      localStorage.setItem('wb-daily-time', '0');
      localStorage.setItem('wb-daily-shorts', '0');
    }
  }, []);

  // Tracking watch time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getMinutes() !== lastTrackedMinute) {
        setDailyWatchTime(prev => {
          const newVal = prev + 1;
          localStorage.setItem('wb-daily-time', newVal.toString());
          return newVal;
        });
        setContinuousWatchTime(prev => prev + 1);
        setLastTrackedMinute(now.getMinutes());
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [lastTrackedMinute]);

  const setLimits = (newLimits: WellBeingLimits) => {
    setLimitsState(newLimits);
    localStorage.setItem('wb-limits', JSON.stringify(newLimits));
  };

  const incrementShortsCount = useCallback(() => {
    setDailyShortsCount(prev => {
      const newVal = prev + 1;
      localStorage.setItem('wb-daily-shorts', newVal.toString());
      return newVal;
    });
  }, []);

  const resetContinuousTime = useCallback(() => {
    setContinuousWatchTime(0);
  }, []);

  const [isBedtime, setIsBedtime] = useState(false);

  useEffect(() => {
    const checkBedtime = () => {
      if (!limits.bedtimeEnabled) {
        setIsBedtime(false);
        return;
      }

      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      
      const [startH, startM] = limits.bedtimeStart.split(':').map(Number);
      const [endH, endM] = limits.bedtimeEnd.split(':').map(Number);

      const startTime = startH * 60 + startM;
      const endTime = endH * 60 + endM;
      const currentTime = currentHours * 60 + currentMinutes;

      if (startTime > endTime) {
        // Spans across midnight
        setIsBedtime(currentTime >= startTime || currentTime < endTime);
      } else {
        setIsBedtime(currentTime >= startTime && currentTime < endTime);
      }
    };

    checkBedtime();
    const interval = setInterval(checkBedtime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [limits.bedtimeEnabled, limits.bedtimeStart, limits.bedtimeEnd]);

  const isLimitReached = limits.dailyTimeLimit > 0 && dailyWatchTime >= limits.dailyTimeLimit;
  const isShortsLimitReached = limits.shortsDailyLimit > 0 && dailyShortsCount >= limits.shortsDailyLimit;

  // Warnings
  useEffect(() => {
    if (limits.dailyTimeLimit > 0 && dailyWatchTime === limits.dailyTimeLimit - 5) {
      toast.warning(t('timeLimitWarning') || "Approaching daily time limit (5 minutes remaining)");
    }
    
    if (limits.breakInterval > 0 && continuousWatchTime >= limits.breakInterval) {
      toast.info(t('breakReminder') || "Time for a short break!");
    }
  }, [dailyWatchTime, continuousWatchTime, limits.dailyTimeLimit, limits.breakInterval, t]);

  return (
    <WellBeingContext.Provider value={{
      dailyWatchTime,
      dailyShortsCount,
      continuousWatchTime,
      isBedtime,
      limits,
      setLimits,
      incrementShortsCount,
      resetContinuousTime,
      isLimitReached,
      isShortsLimitReached
    }}>
      {children}
    </WellBeingContext.Provider>
  );
}

export function useWellBeing() {
  const context = useContext(WellBeingContext);
  if (context === undefined) {
    throw new Error('useWellBeing must be used within a WellBeingProvider');
  }
  return context;
}
