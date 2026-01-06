"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWellBeing } from '@/lib/well-being-context';
import { useI18n } from '@/lib/i18n-context';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Play, Pause, Volume2, VolumeX, MessageCircle, Share2, Music2, Timer } from 'lucide-react';
import YouTube from 'react-youtube';
import Masthead from '@/components/sections/masthead';
import SidebarGuide from '@/components/sections/sidebar-guide';
import { toast } from 'sonner';

interface ShortVideo {
  id: string;
  title: string;
  channelName: string;
  channelAvatar: string;
  likes: string;
  comments: string;
}

const MOCK_SHORTS: ShortVideo[] = [
  { id: 'dQw4w9WgXcQ', title: 'Amazing Nature View 🌿', channelName: 'Nature Lover', channelAvatar: '', likes: '12K', comments: '1.2K' },
  { id: 'jNQXAC9IVRw', title: 'Cooking Tips: Part 1 🍳', channelName: 'Chef Master', channelAvatar: '', likes: '45K', comments: '3.4K' },
  { id: '9bZkp7q19f0', title: 'Morning Routine ☀️', channelName: 'Daily Life', channelAvatar: '', likes: '8K', comments: '500' },
  { id: '3JZ_D3ELwOQ', title: 'Coding in 60 Seconds 💻', channelName: 'Dev Mentor', channelAvatar: '', likes: '22K', comments: '1.1K' },
];

export default function ShortsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { direction, t } = useI18n();
  const { 
    incrementShortsCount, 
    isShortsLimitReached,
    resetContinuousTime,
    dailyShortsCount,
    limits
  } = useWellBeing();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    resetContinuousTime(); // Reset session time when entering shorts
  }, [resetContinuousTime]);

  useEffect(() => {
    if (isShortsLimitReached) {
      setShowLimitModal(true);
    }
  }, [isShortsLimitReached]);

  const handleNext = useCallback(() => {
    if (isShortsLimitReached) {
      setShowLimitModal(true);
      return;
    }
    if (currentIndex < MOCK_SHORTS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      incrementShortsCount();
    } else {
      toast.info("End of feed for now!");
    }
  }, [currentIndex, isShortsLimitReached, incrementShortsCount]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Handle scroll/swipe logic
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 50) {
        if (e.deltaY > 0) handleNext();
        else handlePrev();
      }
    };
    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [handleNext, handlePrev]);

  return (
    <div className="h-screen bg-black overflow-hidden flex flex-col" dir={direction}>
      <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} forceOverlay={true} />
      
      <div className="flex-1 relative flex items-center justify-center pt-16">
        <AnimatePresence mode="wait">
          <motion.div 
            key={MOCK_SHORTS[currentIndex].id}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-[450px] aspect-[9/16] bg-[#1a1a1a] sm:rounded-2xl overflow-hidden shadow-2xl"
          >
            <YouTube
              videoId={MOCK_SHORTS[currentIndex].id}
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  autoplay: 1,
                  controls: 0,
                  modestbranding: 1,
                  loop: 1,
                  mute: isMuted ? 1 : 0,
                },
              }}
              className="w-full h-full"
              onEnd={handleNext} // Auto-advance
            />

            {/* UI Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none flex flex-col justify-between p-6">
              <div className="flex justify-between items-start pointer-events-auto">
                <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <Timer className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-white">{dailyShortsCount} / {limits.shortsDailyLimit || '∞'}</span>
                </div>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white border border-white/10"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>

              <div className="space-y-4 pointer-events-auto">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-white/20" />
                    <span className="font-bold text-white text-sm">@{MOCK_SHORTS[currentIndex].channelName}</span>
                    <button className="bg-white text-black text-xs font-black px-4 py-1.5 rounded-full">
                      {t('subscriptions')}
                    </button>
                  </div>
                  <p className="text-white text-sm line-clamp-2">{MOCK_SHORTS[currentIndex].title}</p>
                  <div className="flex items-center gap-2 text-white/80 text-xs">
                    <Music2 className="w-3 h-3" />
                    <span className="truncate">Original Sound - {MOCK_SHORTS[currentIndex].channelName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
              <div className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 cursor-pointer group-hover:bg-red-500/20 group-hover:border-red-500/40 transition-all">
                  <motion.div whileTap={{ scale: 0.8 }}><Play className="w-6 h-6 fill-current" /></motion.div>
                </div>
                <span className="text-[10px] font-bold text-white">{MOCK_SHORTS[currentIndex].likes}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 cursor-pointer">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-white">{MOCK_SHORTS[currentIndex].comments}</span>
              </div>
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 cursor-pointer">
                <Share2 className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          <button 
            onClick={handlePrev}
            className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-white/20 transition-all"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <button 
            onClick={handleNext}
            className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-white/20 transition-all"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Limit Reached Modal */}
      <AnimatePresence>
        {showLimitModal && (
          <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-6"
            >
              <div className="flex justify-center">
                <div className="p-4 bg-red-500/20 rounded-full">
                  <Timer className="w-12 h-12 text-red-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">{t('dailyLimitReached')}</h2>
                <p className="text-gray-400">
                  {t('shortsLimitReachedDesc') || "You've watched enough Shorts for today! Time to explore some long-form educational content or take a break."}
                </p>
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-4 bg-white text-black rounded-2xl font-black transition-all hover:bg-gray-100"
              >
                {t('back')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
