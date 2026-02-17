"use client";

import { useState, useEffect, useCallback } from "react";

export interface ReaderSettings {
  prefetchAhead: number;
  maxRetries: number;
}

const STORAGE_KEY = "comic-reader-settings";

const DEFAULT_SETTINGS: ReaderSettings = {
  prefetchAhead: 3,
  maxRetries: 5,
};

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch {
      console.warn("Failed to load reader settings");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  return {
    settings,
    updateSettings,
    isLoaded,
  };
}
