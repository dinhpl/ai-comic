"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReaderHeader } from "@/components/reader/reader-header";
import { ReaderFooter } from "@/components/reader/reader-footer";
import { ChapterSection } from "@/components/reader/chapter-section";
import { ChapterSelector } from "@/components/reader/chapter-selector";
import type { FailedImageInfo } from "@/components/reader/comic-image";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { useReadingHistory } from "@/hooks/use-reading-history";
import type { ChapterState } from "@/lib/types";
import { IconLoader2 } from "@tabler/icons-react";

// ============================================================================
// Configuration
// ============================================================================
const PREFETCH_AHEAD = 3;
const VIRTUALIZE_DISTANCE = 5;
const IMAGE_PRELOAD_BATCH = 5;

// ============================================================================
// Image Preloader — fetches images in background so they're browser-cached
// ============================================================================
function preloadImages(images: { src: string }[]): void {
  let index = 0;

  function loadNext() {
    if (index >= images.length) return;
    const img = images[index];
    index++;

    const el = new Image();
    el.onload = loadNext;
    el.onerror = loadNext;
    el.src = `/api/proxy-image?url=${encodeURIComponent(img.src)}`;
  }

  const batchSize = Math.min(IMAGE_PRELOAD_BATCH, images.length);
  for (let i = 0; i < batchSize; i++) {
    loadNext();
  }
}

function ReaderContent() {
  const searchParams = useSearchParams();
  // New params: slug + start chapter number
  const slug = searchParams.get("slug") || "";
  const startChapter = parseInt(searchParams.get("chapter") || "1", 10);
  // Fallback: legacy URL mode (for backward compat)
  const legacyUrl = searchParams.get("url") || "";
  const maxChapters = parseInt(searchParams.get("max") || "9999", 10);

  const { isVisible, toggleVisible } = useScrollDirection();
  const { addToHistory } = useReadingHistory();

  // State
  const [chapters, setChapters] = useState<ChapterState[]>([]);
  const [comicTitle, setComicTitle] = useState("Đang tải...");
  const [comicSlug, setComicSlug] = useState(slug);
  const [totalChaptersDB, setTotalChaptersDB] = useState(maxChapters);
  const [currentVisibleChapter, setCurrentVisibleChapter] =
    useState(startChapter);
  const [progress, setProgress] = useState(0);
  const [allChaptersLoaded, setAllChaptersLoaded] = useState(false);
  const [failedImages, setFailedImages] = useState<FailedImageInfo[]>([]);
  const [showChapterSelector, setShowChapterSelector] = useState(false);

  const [chapterHeights, setChapterHeights] = useState<Map<number, number>>(
    new Map(),
  );

  // Refs
  const fetchQueueRef = useRef<Set<number>>(new Set());
  const chaptersRef = useRef<ChapterState[]>([]);
  const preloadedChaptersRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    chaptersRef.current = chapters;
  }, [chapters]);

  // ──────────────────────────────────────────────────────────────────────────
  // Fetch a single chapter from DB API
  // ──────────────────────────────────────────────────────────────────────────
  const fetchChapterFromDB = useCallback(
    async (chapterNum: number): Promise<ChapterState | null> => {
      const targetSlug = comicSlug;
      if (!targetSlug) return null;

      try {
        const response = await fetch(
          `/api/chapters?slug=${encodeURIComponent(targetSlug)}&chapter=${chapterNum}`,
        );
        const data = await response.json();

        if (!data.success || !data.data) {
          return {
            chapterNumber: chapterNum,
            chapterTitle: `Chương ${chapterNum}`,
            images: [],
            loaded: true,
            loading: false,
            error: data.error || "Chương chưa được crawl",
            nextChapterUrl: null,
          };
        }

        return {
          chapterNumber: data.data.chapterNumber,
          chapterTitle: data.data.chapterTitle,
          images: data.data.images,
          loaded: true,
          loading: false,
          error: null,
          nextChapterUrl: data.data.hasNextChapter ? "has-next" : null,
        };
      } catch (err) {
        return {
          chapterNumber: chapterNum,
          chapterTitle: `Chương ${chapterNum}`,
          images: [],
          loaded: true,
          loading: false,
          error: err instanceof Error ? err.message : "Lỗi không xác định",
          nextChapterUrl: null,
        };
      }
    },
    [comicSlug],
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Fetch and add chapter to state
  // ──────────────────────────────────────────────────────────────────────────
  const fetchAndAddChapter = useCallback(
    async (chapterNum: number) => {
      if (fetchQueueRef.current.has(chapterNum)) return;
      fetchQueueRef.current.add(chapterNum);

      const existing = chaptersRef.current.find(
        (c) => c.chapterNumber === chapterNum,
      );
      if (existing && existing.loaded && !existing.error) {
        fetchQueueRef.current.delete(chapterNum);
        return;
      }

      // Add loading placeholder
      setChapters((prev) => {
        const exists = prev.find((c) => c.chapterNumber === chapterNum);
        if (exists) {
          return prev.map((c) =>
            c.chapterNumber === chapterNum
              ? { ...c, loading: true, error: null }
              : c,
          );
        }
        const newCh: ChapterState = {
          chapterNumber: chapterNum,
          chapterTitle: `Chương ${chapterNum}`,
          images: [],
          loaded: false,
          loading: true,
          error: null,
          nextChapterUrl: null,
        };
        return [...prev, newCh].sort(
          (a, b) => a.chapterNumber - b.chapterNumber,
        );
      });

      const result = await fetchChapterFromDB(chapterNum);

      if (result) {
        setChapters((prev) =>
          prev.map((ch) => (ch.chapterNumber === chapterNum ? result : ch)),
        );

        // Preload images in background
        if (
          result.images.length > 0 &&
          !result.error &&
          !preloadedChaptersRef.current.has(chapterNum)
        ) {
          preloadedChaptersRef.current.add(chapterNum);
          preloadImages(result.images);
        }

        // Mark end if no next chapter
        if (!result.nextChapterUrl && result.loaded && !result.error) {
          setAllChaptersLoaded(true);
        }

        // Save history
        addToHistory({
          title: comicTitle,
          slug: comicSlug,
          coverUrl: result.images[0]?.src || "",
          lastChapter: result.chapterNumber,
          lastChapterUrl: `/read?slug=${comicSlug}&chapter=${result.chapterNumber}`,
          sourceUrl: `/read?slug=${comicSlug}&chapter=${startChapter}`,
          maxChapters: totalChaptersDB,
        });
      }

      fetchQueueRef.current.delete(chapterNum);
    },
    [
      fetchChapterFromDB,
      addToHistory,
      comicTitle,
      comicSlug,
      startChapter,
      totalChaptersDB,
    ],
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Prefetch upcoming chapters
  // ──────────────────────────────────────────────────────────────────────────
  const prefetchChapters = useCallback(
    (fromChapter: number) => {
      for (let i = 1; i <= PREFETCH_AHEAD; i++) {
        const target = fromChapter + i;

        if (target > totalChaptersDB) {
          if (i === 1) setAllChaptersLoaded(true);
          break;
        }

        const existing = chaptersRef.current.find(
          (c) => c.chapterNumber === target,
        );
        if (
          existing &&
          (existing.loaded || existing.loading) &&
          !existing.error
        ) {
          continue;
        }
        if (fetchQueueRef.current.has(target)) continue;

        fetchAndAddChapter(target);
      }
    },
    [totalChaptersDB, fetchAndAddChapter],
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Load initial chapter
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const effectiveSlug =
      slug || (legacyUrl ? extractSlugFromLegacyUrl(legacyUrl) : "");
    if (!effectiveSlug || chapters.length > 0) return;

    setComicSlug(effectiveSlug);

    const effectiveStart = slug
      ? startChapter
      : extractChapterFromLegacyUrl(legacyUrl);

    setChapters([
      {
        chapterNumber: effectiveStart,
        chapterTitle: `Chương ${effectiveStart}`,
        images: [],
        loaded: false,
        loading: true,
        error: null,
        nextChapterUrl: null,
      },
    ]);

    (async () => {
      // First get comic info
      const infoRes = await fetch(
        `/api/chapters?slug=${encodeURIComponent(effectiveSlug)}&chapter=${effectiveStart}`,
      );
      const infoData = await infoRes.json();

      if (infoData.success && infoData.data) {
        const title =
          infoData.data.comic?.title || effectiveSlug.replace(/-/g, " ");
        setComicTitle(title);
        setTotalChaptersDB(infoData.data.comic?.totalChapters || maxChapters);

        const result: ChapterState = {
          chapterNumber: infoData.data.chapterNumber,
          chapterTitle: infoData.data.chapterTitle,
          images: infoData.data.images,
          loaded: true,
          loading: false,
          error: null,
          nextChapterUrl: infoData.data.hasNextChapter ? "has-next" : null,
        };

        setChapters([result]);
        setCurrentVisibleChapter(effectiveStart);

        // Preload first chapter images
        if (result.images.length > 0) {
          preloadedChaptersRef.current.add(effectiveStart);
          preloadImages(result.images);
        }

        addToHistory({
          title,
          slug: effectiveSlug,
          coverUrl:
            infoData.data.comic?.coverUrl || result.images[0]?.src || "",
          lastChapter: effectiveStart,
          lastChapterUrl: `/read?slug=${effectiveSlug}&chapter=${effectiveStart}`,
          sourceUrl: `/read?slug=${effectiveSlug}&chapter=${effectiveStart}`,
          maxChapters: infoData.data.comic?.totalChapters || maxChapters,
        });

        // Prefetch next chapters
        setTimeout(() => prefetchChapters(effectiveStart), 300);

        // Scroll to chapter if reloading
        const reloadTo = sessionStorage.getItem("reload-to-chapter");
        if (reloadTo) {
          sessionStorage.removeItem("reload-to-chapter");
          const targetNum = parseInt(reloadTo, 10);
          setTimeout(() => {
            const el = document.getElementById(`chapter-${targetNum}`);
            if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
          }, 300);
        }
      } else {
        setChapters([
          {
            chapterNumber: effectiveStart,
            chapterTitle: `Chương ${effectiveStart}`,
            images: [],
            loaded: true,
            loading: false,
            error: infoData.error || "Truyện chưa được crawl vào database",
            nextChapterUrl: null,
          },
        ]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, legacyUrl]);

  // ──────────────────────────────────────────────────────────────────────────
  // When current chapter changes → prefetch more
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentVisibleChapter > 0 && chapters.length > 0) {
      prefetchChapters(currentVisibleChapter);
    }
  }, [currentVisibleChapter, prefetchChapters, chapters.length]);

  // ──────────────────────────────────────────────────────────────────────────
  // Scroll tracking
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        setProgress(
          docHeight > 0
            ? Math.min(100, Math.round((scrollTop / docHeight) * 100))
            : 0,
        );

        const chapterEls = document.querySelectorAll("[id^='chapter-']");
        let found = currentVisibleChapter;
        chapterEls.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 250 && rect.bottom > 250) {
            const m = el.id.match(/chapter-(\d+)/);
            if (m) found = parseInt(m[1], 10);
          }
        });
        if (found !== currentVisibleChapter) {
          setCurrentVisibleChapter(found);
        }

        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentVisibleChapter]);

  // ──────────────────────────────────────────────────────────────────────────
  // Height measurement callback
  // ──────────────────────────────────────────────────────────────────────────
  const handleHeightMeasured = useCallback(
    (chapterNumber: number, height: number) => {
      setChapterHeights((prev) => {
        if (prev.get(chapterNumber) === height) return prev;
        const next = new Map(prev);
        next.set(chapterNumber, height);
        return next;
      });
    },
    [],
  );

  const isChapterVirtualized = useCallback(
    (chapterNumber: number): boolean => {
      const distance = Math.abs(chapterNumber - currentVisibleChapter);
      const hasSavedHeight = chapterHeights.has(chapterNumber);
      return distance > VIRTUALIZE_DISTANCE && hasSavedHeight;
    },
    [currentVisibleChapter, chapterHeights],
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Retry a failed chapter
  // ──────────────────────────────────────────────────────────────────────────
  const retryChapter = useCallback(
    (chapterNum: number) => {
      fetchQueueRef.current.delete(chapterNum);
      fetchAndAddChapter(chapterNum);
    },
    [fetchAndAddChapter],
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Failed image tracking
  // ──────────────────────────────────────────────────────────────────────────
  const handleImagePermanentFailure = useCallback((info: FailedImageInfo) => {
    setFailedImages((prev) => {
      if (
        prev.some(
          (f) =>
            f.chapterNumber === info.chapterNumber &&
            f.imageIndex === info.imageIndex,
        )
      ) {
        return prev;
      }
      return [...prev, info];
    });
  }, []);

  const handleImageFailureResolved = useCallback((info: FailedImageInfo) => {
    setFailedImages((prev) =>
      prev.filter(
        (f) =>
          !(
            f.chapterNumber === info.chapterNumber &&
            f.imageIndex === info.imageIndex
          ),
      ),
    );
  }, []);

  const loadedCount = chapters.filter((c) => c.loaded && !c.error).length;
  const loadedChapterNumbers = chapters
    .filter((c) => c.loaded && !c.error)
    .map((c) => c.chapterNumber);

  // ──────────────────────────────────────────────────────────────────────────
  // Navigate to a specific chapter (from selector or prev/next buttons)
  // ──────────────────────────────────────────────────────────────────────────
  const navigateToChapter = useCallback(
    (chapterNum: number) => {
      // If chapter is already loaded, scroll to it
      const existing = chaptersRef.current.find(
        (c) => c.chapterNumber === chapterNum && c.loaded && !c.error,
      );
      if (existing) {
        const el = document.getElementById(`chapter-${chapterNum}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          setCurrentVisibleChapter(chapterNum);
          return;
        }
      }
      // Otherwise fetch it
      fetchAndAddChapter(chapterNum);
      // Wait for it to render, then scroll
      const interval = setInterval(() => {
        const el = document.getElementById(`chapter-${chapterNum}`);
        if (el) {
          clearInterval(interval);
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          setCurrentVisibleChapter(chapterNum);
        }
      }, 200);
      // Safety timeout
      setTimeout(() => clearInterval(interval), 5000);
    },
    [fetchAndAddChapter],
  );

  return (
    <div className="min-h-dvh bg-background" onClick={toggleVisible}>
      <ReaderHeader
        title={comicTitle}
        currentChapter={currentVisibleChapter}
        isVisible={isVisible}
      />

      <main className="max-w-3xl mx-auto pt-14 pb-24">
        {chapters.map((chapter, idx) => (
          <ChapterSection
            key={chapter.chapterNumber}
            chapter={chapter}
            isFirst={idx === 0}
            onRetry={() => retryChapter(chapter.chapterNumber)}
            isVirtualized={isChapterVirtualized(chapter.chapterNumber)}
            savedHeight={chapterHeights.get(chapter.chapterNumber) || 0}
            onHeightMeasured={handleHeightMeasured}
            onImagePermanentFailure={handleImagePermanentFailure}
            onImageFailureResolved={handleImageFailureResolved}
          />
        ))}

        {allChaptersLoaded && loadedCount > 0 && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              Đã hết truyện!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Bạn đã đọc hết {loadedCount} chương
            </p>
          </div>
        )}
      </main>

      <ReaderFooter
        currentChapter={currentVisibleChapter}
        maxChapters={totalChaptersDB}
        failedImages={failedImages}
        progress={progress}
        onOpenChapterSelector={() => setShowChapterSelector(true)}
        onNavigateChapter={navigateToChapter}
      />

      <ChapterSelector
        slug={comicSlug}
        currentChapter={currentVisibleChapter}
        isOpen={showChapterSelector}
        onClose={() => setShowChapterSelector(false)}
        onSelectChapter={navigateToChapter}
        loadedChapters={loadedChapterNumbers}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers for legacy URL mode
// ──────────────────────────────────────────────────────────────────────────
function extractSlugFromLegacyUrl(url: string): string {
  const match = url.match(/truyen-tranh\/([^/]+)/);
  return match ? match[1] : "";
}

function extractChapterFromLegacyUrl(url: string): number {
  const match = url.match(/chuong-(\d+)/i);
  return match ? parseInt(match[1], 10) : 1;
}

export default function ReadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-coral flex items-center justify-center shadow-md">
              <IconLoader2 size={22} className="text-white animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      }
    >
      <ReaderContent />
    </Suspense>
  );
}
