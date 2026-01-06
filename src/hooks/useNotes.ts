"use client";

import { useState, useEffect, useCallback } from 'react';
import { VideoNote } from '@/lib/types';

const NOTES_STORAGE_KEY = 'youtube-video-notes';

export function useNotes() {
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY);
    if (stored) {
      try {
        setNotes(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse notes:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes, isLoaded]);

  const addNote = useCallback((note: Omit<VideoNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: VideoNote = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [...prev, newNote]);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<VideoNote>) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    ));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  }, []);

  const getNotesByVideoId = useCallback((videoId: string) => {
    return notes.filter(note => note.videoId === videoId);
  }, [notes]);

  const getAllNotes = useCallback(() => {
    return notes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notes]);

  return {
    notes,
    isLoaded,
    addNote,
    updateNote,
    deleteNote,
    getNotesByVideoId,
    getAllNotes,
  };
}
