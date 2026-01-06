"use client";

import React, { useState, useRef, useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { 
  Play, 
  Pause, 
  Maximize, 
  Settings, 
  Lock, 
  Unlock, 
  Volume2, 
  VolumeX,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CleanYouTubePlayerProps {
  videoId: string;
  startTime?: number;
  onReady?: (event: any) => void;
  onStateChange?: (event: any) => void;
  isLocked?: boolean;
  onLockToggle?: (locked: boolean) => void;
}

export default function CleanYouTubePlayer({ 
  videoId, 
  startTime = 0,
  onReady,
  onStateChange,
  isLocked = false,
  onLockToggle
}: CleanYouTubePlayerProps) {
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleReady = (event: any) => {
    setPlayer(event.target);
    if (onReady) onReady(event);
  };

  const handleStateChange = (event: any) => {
    setIsPlaying(event.data === 1);
    if (onStateChange) onStateChange(event);
  };

  const togglePlay = () => {
    if (isLocked) return;
    if (isPlaying) {
      player?.pauseVideo();
    } else {
      player?.playVideo();
    }
  };

  const toggleMute = () => {
    if (isLocked) return;
    if (isMuted) {
      player?.unMute();
      setIsMuted(false);
    } else {
      player?.mute();
      setIsMuted(true);
    }
  };

  const changeSpeed = (speed: number) => {
    if (isLocked) return;
    player?.setPlaybackRate(speed);
    setPlaybackSpeed(speed);
    setShowSettings(false);
  };

  const toggleFullScreen = () => {
    if (isLocked) return;
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleMouseMove = () => {
    if (isLocked) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showSettings) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => !showSettings && !isLocked && setShowControls(false)}
    >
      <YouTube
        videoId={videoId}
        onReady={handleReady}
        onStateChange={handleStateChange}
        opts={{
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            fs: 0,
            start: startTime,
            enablejsapi: 1,
            disablekb: 1,
          },
        }}
        className="w-full h-full pointer-events-none"
      />

      {/* Overlay to catch clicks and prevent YT interactions */}
      <div 
        className="absolute inset-0 z-10 cursor-pointer" 
        onClick={togglePlay}
      />

      {/* Lock Button (Always Visible or on hover) */}
      <div className="absolute top-4 left-4 z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLockToggle?.(!isLocked);
          }}
          className={cn(
            "p-2.5 rounded-xl backdrop-blur-md transition-all duration-300 border border-white/20",
            isLocked 
              ? "bg-red-600/80 text-white opacity-100 scale-110 shadow-lg shadow-red-600/40" 
              : "bg-black/40 text-white/70 hover:bg-black/60 hover:text-white opacity-0 group-hover:opacity-100"
          )}
        >
          {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
        </button>
      </div>

      {/* Custom Controls */}
      <AnimatePresence>
        {(showControls && !isLocked) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
          >
            <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                    className={cn(
                      "p-2 text-white hover:bg-white/20 rounded-lg transition-colors",
                      showSettings && "bg-white/20"
                    )}
                  >
                    <Settings size={20} className={cn("transition-transform duration-500", showSettings && "rotate-90")} />
                  </button>

                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -5 }}
                        className="absolute bottom-full right-0 mb-2 w-32 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                      >
                        <div className="p-2 space-y-1">
                          <p className="text-[10px] font-bold text-gray-500 uppercase px-2 mb-1">السرعة</p>
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                            <button
                              key={speed}
                              onClick={(e) => { e.stopPropagation(); changeSpeed(speed); }}
                              className={cn(
                                "w-full text-right px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                                playbackSpeed === speed ? "bg-red-600 text-white" : "text-gray-300 hover:bg-white/10"
                              )}
                            >
                              {speed === 1 ? "عادي" : `${speed}x`}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); toggleFullScreen(); }}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Maximize size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock Overlay (Blocking everything when locked) */}
      {isLocked && (
        <div 
          className="absolute inset-0 z-[25] cursor-default"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
