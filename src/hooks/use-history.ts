"use client";

import { useState, useEffect } from "react";
import { useUser } from "./use-user";

export function useHistory() {
  const { userId } = useUser();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/history?userId=${userId}`);
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching history:", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const isWatched = (videoId: string) => {
    return Array.isArray(history) && history.some((h) => h.videoId === videoId);
  };

  return { history, loading, isWatched, refresh: fetchHistory };
}
