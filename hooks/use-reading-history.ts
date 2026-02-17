"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReadingHistoryItem } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";

const STORAGE_KEY = "comic-reading-history";
const MAX_ITEMS = 20;

export function useReadingHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load from localStorage (guest mode / initial)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      console.warn("Failed to load reading history");
    } finally {
      if (!user) setIsLoaded(true);
    }
  }, [user]);

  // 2. Load from Supabase (user mode)
  useEffect(() => {
    if (!user) return;

    const fetchUserHistory = async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("user_reading_history")
        .select(`
          last_chapter,
          updated_at,
          comics (
            id,
            slug,
            title,
            cover_url,
            source_url,
            total_chapters
          )
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(MAX_ITEMS);

      if (data && !error) {
        const syncedHistory: ReadingHistoryItem[] = data.map((item: any) => ({
          id: item.comics.slug,
          slug: item.comics.slug,
          title: item.comics.title,
          coverUrl: item.comics.cover_url,
          lastChapter: item.last_chapter,
          lastChapterUrl: `/read?slug=${item.comics.slug}&chapter=${item.last_chapter}`,
          lastReadAt: new Date(item.updated_at).getTime(),
          sourceUrl: item.comics.source_url,
          maxChapters: item.comics.total_chapters,
        }));

        // Merge logic: guest history items that are not in syncedHistory
        const localOnly = history.filter(
          (h) => !syncedHistory.some((s) => s.slug === h.slug)
        );

        if (localOnly.length > 0) {
          // Sync local items to DB
          for (const item of localOnly) {
            const { data: comicData } = await supabase
              .from("comics")
              .select("id")
              .eq("slug", item.slug)
              .single();

            if (comicData) {
              await supabase.from("user_reading_history").upsert({
                user_id: user.id,
                comic_id: comicData.id,
                last_chapter: item.lastChapter,
                updated_at: new Date(item.lastReadAt).toISOString(),
              });
            }
          }
          // Fetch again to get full merged list
          fetchUserHistory();
          return;
        }

        setHistory(syncedHistory);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedHistory));
      }
      setIsLoaded(true);
    };

    fetchUserHistory();
  }, [user]);

  // Save to localStorage whenever history changes locally
  const saveHistoryLocally = useCallback((items: ReadingHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setHistory(items);
    } catch {
      console.warn("Failed to save reading history to localStorage");
    }
  }, []);

  // Add or update a history item
  const addToHistory = useCallback(
    async (item: Omit<ReadingHistoryItem, "id" | "lastReadAt">) => {
      const id = item.slug || item.sourceUrl;
      const now = Date.now();

      setHistory((prev) => {
        const filtered = prev.filter((h) => h.id !== id);
        const newItem: ReadingHistoryItem = {
          ...item,
          id,
          lastReadAt: now,
        };
        const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      // Sync to Supabase if logged in
      if (user && item.slug) {
        const supabase = getSupabase();
        
        // Find comic id first
        const { data: comicData } = await supabase
          .from("comics")
          .select("id")
          .eq("slug", item.slug)
          .single();

        if (comicData) {
          await supabase.from("user_reading_history").upsert({
            user_id: user.id,
            comic_id: comicData.id,
            last_chapter: item.lastChapter,
            updated_at: new Date(now).toISOString(),
          });
        }
      }
    },
    [user]
  );

  // Remove a history item
  const removeFromHistory = useCallback(
    async (id: string) => {
      setHistory((prev) => {
        const updated = prev.filter((h) => h.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      if (user) {
        const supabase = getSupabase();
        // Delete from DB (we need comic_id but we have slug/id as string)
        const { data: comicData } = await supabase
          .from("comics")
          .select("id")
          .eq("slug", id)
          .single();

        if (comicData) {
          await supabase
            .from("user_reading_history")
            .delete()
            .eq("user_id", user.id)
            .eq("comic_id", comicData.id);
        }
      }
    },
    [user]
  );

  // Clear all history
  const clearHistory = useCallback(async () => {
    setHistory([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    if (user) {
      const supabase = getSupabase();
      await supabase
        .from("user_reading_history")
        .delete()
        .eq("user_id", user.id);
    }
  }, [user]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    isLoaded,
  };
}
