"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReadingHistoryItem } from "@/lib/types";

const STORAGE_KEY = "comic-reading-history";
const MAX_ITEMS = 20;

export function useReadingHistory() {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      console.warn("Failed to load reading history");
    }
  }, []);

  // Save to localStorage whenever history changes
  const saveHistory = useCallback((items: ReadingHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setHistory(items);
    } catch {
      console.warn("Failed to save reading history");
    }
  }, []);

  // Add or update a history item
  const addToHistory = useCallback(
    (item: Omit<ReadingHistoryItem, "id" | "lastReadAt">) => {
      setHistory((prev) => {
        const id = item.slug || item.sourceUrl;
        // Remove existing entry for this comic
        const filtered = prev.filter((h) => h.id !== id);

        const newItem: ReadingHistoryItem = {
          ...item,
          id,
          lastReadAt: Date.now(),
        };

        // Add to front, limit to MAX_ITEMS
        const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);

        // Save async
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }

        return updated;
      });
    },
    []
  );

  // Remove a history item
  const removeFromHistory = useCallback(
    (id: string) => {
      const updated = history.filter((h) => h.id !== id);
      saveHistory(updated);
    },
    [history, saveHistory]
  );

  // Clear all history
  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
