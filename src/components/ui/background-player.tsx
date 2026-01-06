"use client";

import React, { useRef, useState, useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Minimize2 } from 'lucide-react';

interface BackgroundPlayerProps {
  videoId: string;
  videoTitle: string;
  thumbnail: string;
  initialTime?: number;
  onClose: () => void;
}

export default function BackgroundPlayer({ 
  videoId, 
  videoTitle, 
  thumbnail, 
  initialTime = 0,
  onClose 
}: BackgroundPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&start=${Math.floor(initialTime)}&enablejsapi=1`;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.src = embedUrl;
    iframe.id = 'background-audio-player';
    
    document.body.appendChild(iframe);
    setAudioReady(true);

    return () => {
      const existingIframe = document.getElementById('background-audio-player');
      if (existingIframe) {
        document.body.removeChild(existingIframe);
      }
    };
  }, [videoId, initialTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (isPlaying && duration > 0) {
          return Math.min(prev + 1, duration);
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  useEffect(() => {
    setDuration(300);
    setIsPlaying(true);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    const iframe = document.getElementById('background-audio-player') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      const command = isPlaying ? 'pauseVideo' : 'playVideo';
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command }),
        '*'
      );
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const iframe = document.getElementById('background-audio-player') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      const command = isMuted ? 'unMute' : 'mute';
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command }),
        '*'
      );
    }
    setIsMuted(!isMuted);
  };

  const seekTo = (time: number) => {
    const iframe = document.getElementById('background-audio-player') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [time, true] }),
        '*'
      );
    }
    setCurrentTime(time);
  };

  const skipForward = () => seekTo(Math.min(currentTime + 10, duration));
  const skipBackward = () => seekTo(Math.max(currentTime - 10, 0));

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-4 left-4 z-[2500] bg-[#0f0f0f] rounded-full shadow-2xl cursor-pointer hover:scale-105 transition-transform"
        onClick={() => setIsMinimized(false)}
        dir="rtl"
      >
        <div className="flex items-center gap-3 p-2 pr-4">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            className="text-white hover:text-red-500 transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[2500] bg-gradient-to-t from-[#0f0f0f] to-[#1a1a1a] shadow-2xl"
      dir="rtl"
    >
      <div className="relative">
        <div 
          className="absolute top-0 left-0 right-0 h-1 bg-white/20 cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            seekTo(percent * duration);
          }}
        >
          <div 
            className="h-full bg-red-600 transition-all group-hover:bg-red-500"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>

        <div className="flex items-center gap-4 p-4 pt-5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
              <img src={thumbnail} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm line-clamp-1">{videoTitle}</p>
              <p className="text-white/60 text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={skipBackward}
              className="p-2 text-white/80 hover:text-white transition-colors"
              title="10 ثوانٍ للخلف"
            >
              <SkipBack size={20} />
            </button>
            
            <button
              onClick={togglePlayPause}
              className="p-3 bg-white rounded-full text-[#0f0f0f] hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="mr-[-2px]" />}
            </button>
            
            <button
              onClick={skipForward}
              className="p-2 text-white/80 hover:text-white transition-colors"
              title="10 ثوانٍ للأمام"
            >
              <SkipForward size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="p-2 text-white/80 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 text-white/80 hover:text-white transition-colors"
              title="تصغير"
            >
              <Minimize2 size={20} />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-red-500 transition-colors"
              title="إغلاق"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}