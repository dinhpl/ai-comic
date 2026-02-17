"use client";

import { useState, useCallback } from "react";
import type { ChapterData, CrawlResponse } from "@/lib/types";

export function useChapterCrawl() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crawlChapter = useCallback(
    async (url: string): Promise<ChapterData | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/crawl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const data: CrawlResponse = await response.json();

        if (!data.success || !data.data) {
          const errorMsg = data.error || "Không thể tải chương này";
          setError(errorMsg);
          return null;
        }

        return data.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Lỗi không xác định";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { crawlChapter, loading, error, clearError: () => setError(null) };
}
