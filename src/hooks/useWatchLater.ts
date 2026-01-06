"use client";

import { useState, useEffect, useCallback } from 'react';

export interface WatchLaterItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelName: string;
  duration: string;
  addedAt: string;
}

const WATCH_LATER_STORAGE_KEY = 'youtube-watch-later';

export function useWatchLater() {
  const [watchLater, setWatchLater] = useState<WatchLaterItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(WATCH_LATER_STORAGE_KEY);
    if (stored) {
      try {
        setWatchLater(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse watch later items:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(WATCH_LATER_STORAGE_KEY, JSON.stringify(watchLater));
    }
  }, [watchLater, isLoaded]);

  const addToWatchLater = useCallback((video: Omit<WatchLaterItem, 'id' | 'addedAt'>) => {
    const newItem: WatchLaterItem = {
      ...video,
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
    };
    setWatchLater(prev => {
      if (prev.some(item => item.videoId === video.videoId)) {
        return prev;
      }
      return [newItem, ...prev];
    });
    return newItem;
  }, []);

  const removeFromWatchLater = useCallback((videoId: string) => {
    setWatchLater(prev => prev.filter(item => item.videoId !== videoId));
  }, []);

  const toggleWatchLater = useCallback((video: Omit<WatchLaterItem, 'id' | 'addedAt'>) => {
    const exists = watchLater.some(item => item.videoId === video.videoId);
    if (exists) {
      removeFromWatchLater(video.videoId);
      return false;
    } else {
      addToWatchLater(video);
      return true;
    }
  }, [watchLater, addToWatchLater, removeFromWatchLater]);

  const isInWatchLater = useCallback((videoId: string) => {
    return watchLater.some(item => item.videoId === videoId);
  }, [watchLater]);

  const getAllWatchLater = useCallback(() => {
    return [...watchLater].sort((a, b) => 
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  }, [watchLater]);

  return {
    watchLater,
    isLoaded,
    addToWatchLater,
    removeFromWatchLater,
    toggleWatchLater,
    isInWatchLater,
    getAllWatchLater,
  };
}
