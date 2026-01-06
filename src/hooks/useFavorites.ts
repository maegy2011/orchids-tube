"use client";

import { useState, useEffect, useCallback } from 'react';

export interface FavoriteItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelName: string;
  duration: string;
  addedAt: string;
}

const FAVORITES_STORAGE_KEY = 'youtube-favorites';
const DENIED_STORAGE_KEY = 'youtube-denied-videos';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [deniedVideos, setDeniedVideos] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const storedDenied = localStorage.getItem(DENIED_STORAGE_KEY);
    
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites));
      } catch (e) {
        console.error('Failed to parse favorites:', e);
      }
    }
    
    if (storedDenied) {
      try {
        setDeniedVideos(JSON.parse(storedDenied));
      } catch (e) {
        console.error('Failed to parse denied videos:', e);
      }
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(DENIED_STORAGE_KEY, JSON.stringify(deniedVideos));
    }
  }, [deniedVideos, isLoaded]);

  const addFavorite = useCallback((video: Omit<FavoriteItem, 'id' | 'addedAt'>) => {
    const newFavorite: FavoriteItem = {
      ...video,
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
    };
    setFavorites(prev => {
      if (prev.some(f => f.videoId === video.videoId)) {
        return prev;
      }
      return [...prev, newFavorite];
    });
    return newFavorite;
  }, []);

  const removeFavorite = useCallback((videoId: string) => {
    setFavorites(prev => prev.filter(f => f.videoId !== videoId));
  }, []);

  const toggleFavorite = useCallback((video: Omit<FavoriteItem, 'id' | 'addedAt'>) => {
    const exists = favorites.some(f => f.videoId === video.videoId);
    if (exists) {
      removeFavorite(video.videoId);
      return false;
    } else {
      addFavorite(video);
      return true;
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((videoId: string) => {
    return favorites.some(f => f.videoId === videoId);
  }, [favorites]);

  const denyVideo = useCallback((videoId: string) => {
    setDeniedVideos(prev => {
      if (prev.includes(videoId)) return prev;
      return [...prev, videoId];
    });
    removeFavorite(videoId);
  }, [removeFavorite]);

  const undenyVideo = useCallback((videoId: string) => {
    setDeniedVideos(prev => prev.filter(id => id !== videoId));
  }, []);

  const isDenied = useCallback((videoId: string) => {
    return deniedVideos.includes(videoId);
  }, [deniedVideos]);

  const getAllFavorites = useCallback(() => {
    return favorites.sort((a, b) => 
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  }, [favorites]);

  return {
    favorites,
    deniedVideos,
    isLoaded,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    denyVideo,
    undenyVideo,
    isDenied,
    getAllFavorites,
  };
}
