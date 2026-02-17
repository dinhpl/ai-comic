"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";

export interface ReaderSettings {
  prefetchAhead: number;
  maxRetries: number;
}

const STORAGE_KEY = "comic-reader-settings";

const DEFAULT_SETTINGS: ReaderSettings = {
  prefetchAhead: 2,
  maxRetries: 7,
};

export function useReaderSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load from localStorage (guest mode / initial)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch {
      console.warn("Failed to load reader settings from localStorage");
    } finally {
      if (!user) setIsLoaded(true);
    }
  }, [user]);

  // 2. Load from Supabase (user mode)
  useEffect(() => {
    if (!user) return;

    const fetchUserSettings = async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("user_reader_settings")
        .select("prefetch_ahead, max_retries")
        .eq("user_id", user.id)
        .single();

      if (data && !error) {
        const synced = {
          prefetchAhead: data.prefetch_ahead,
          maxRetries: data.max_retries,
        };
        setSettings(synced);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
      }
      setIsLoaded(true);
    };

    fetchUserSettings();
  }, [user]);

  const updateSettings = useCallback(
    async (newSettings: Partial<ReaderSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        // Sync to Supabase if logged in
        if (user) {
          const supabase = getSupabase();
          supabase
            .from("user_reader_settings")
            .upsert({
              user_id: user.id,
              prefetch_ahead: updated.prefetchAhead,
              max_retries: updated.maxRetries,
              updated_at: new Date().toISOString(),
            })
            .then(({ error }) => {
              if (error) console.error("Failed to sync settings to Supabase", error);
            });
        }

        return updated;
      });
    },
    [user]
  );

  return {
    settings,
    updateSettings,
    isLoaded,
  };
}
