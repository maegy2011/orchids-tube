"use client";

import { useState, useEffect } from "react";

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function useUser() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem("app_user_id");
    if (!id) {
      id = generateId();
      localStorage.setItem("app_user_id", id);
    }
    setUserId(id);
  }, []);

  return { userId };
}
