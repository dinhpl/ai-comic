"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReaderHeader } from "@/components/reader/reader-header";
import { ReaderFooter } from "@/components/reader/reader-footer";
import { ChapterSection } from "@/components/reader/chapter-section";
import type { FailedImageInfo } from "@/components/reader/comic-image";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { useReadingHistory } from "@/hooks/use-reading-history";
import { extractSlugFromUrl } from "@/lib/crawler";
import type { ChapterState, CrawlResponse } from "@/lib/types";
import { IconLoader2 } from "@tabler/icons-react";

// ============================================================================
// Configuration
// ============================================================================
const PREFETCH_AHEAD = 3; // How many chapters to prefetch ahead
const CRAWL_DELAY = 600; // Delay between crawl requests (ms)
const VIRTUALIZE_DISTANCE = 5; // Chapters further than this from current → virtualize
const IMAGE_PRELOAD_BATCH = 5; // How many images to preload concurrently

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
    el.onerror = loadNext; // skip failed ones, ComicImage will retry
    el.src = `/api/proxy-image?url=${encodeURIComponent(img.src)}`;
  }

  // Start IMAGE_PRELOAD_BATCH concurrent downloads
  const batchSize = Math.min(IMAGE_PRELOAD_BATCH, images.length);
  for (let i = 0; i < batchSize; i++) {
    loadNext();
  }
}

function ReaderContent() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") || "";
  const maxChapters = parseInt(searchParams.get("max") || "9999", 10);

  const { isVisible, toggleVisible } = useScrollDirection();
  const { addToHistory } = useReadingHistory();

  // State
  const [chapters, setChapters] = useState<ChapterState[]>([]);
  const [comicTitle, setComicTitle] = useState("Đang tải...");
  const [currentVisibleChapter, setCurrentVisibleChapter] = useState(1);
  const [progress, setProgress] = useState(0);
  const [allChaptersLoaded, setAllChaptersLoaded] = useState(false);
  const [failedImages, setFailedImages] = useState<FailedImageInfo[]>([]);

  // Saved chapter heights for virtualization placeholders
  const [chapterHeights, setChapterHeights] = useState<Map<number, number>>(
    new Map(),
  );

  // Refs
  const crawlQueueRef = useRef<Set<number>>(new Set());
  const chaptersRef = useRef<ChapterState[]>([]);
  const comicTitleRef = useRef("Đang tải...");
  const preloadedChaptersRef = useRef<Set<number>>(new Set());
  const chapterUrlMapRef = useRef<Map<number, string>>(new Map());

  // Keep refs in sync with state
  useEffect(() => {
    chaptersRef.current = chapters;
  }, [chapters]);
  useEffect(() => {
    comicTitleRef.current = comicTitle;
  }, [comicTitle]);

  // ──────────────────────────────────────────────────────────────────────────
  // Crawl a single chapter
  // ──────────────────────────────────────────────────────────────────────────
  const crawlChapter = useCallback(
    async (url: string, chapterNum: number): Promise<ChapterState | null> => {
      try {
        const response = await fetch("/api/crawl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const data: CrawlResponse = await response.json();

        if (!data.success || !data.data) {
          return {
            chapterNumber: chapterNum,
            chapterTitle: `Chương ${chapterNum}`,
            images: [],
            loaded: true,
            loading: false,
            error: data.error || "Không thể tải chương",
            nextChapterUrl: null,
          };
        }

        // Save next chapter URL mapping
        if (data.data.nextChapterUrl) {
          chapterUrlMapRef.current.set(
            data.data.chapterNumber + 1,
            data.data.nextChapterUrl,
          );
        }

        return {
          chapterNumber: data.data.chapterNumber,
          chapterTitle: data.data.chapterTitle,
          images: data.data.images,
          loaded: true,
          loading: false,
          error: null,
          nextChapterUrl: data.data.nextChapterUrl,
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
    [],
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Fetch a chapter and add to state
  // ──────────────────────────────────────────────────────────────────────────
  const fetchAndAddChapter = useCallback(
    async (chapterNum: number, url: string) => {
      // Prevent duplicate fetches
      if (crawlQueueRef.current.has(chapterNum)) return;
      crawlQueueRef.current.add(chapterNum);

      // Skip if already loaded successfully
      const existing = chaptersRef.current.find(
        (c) => c.chapterNumber === chapterNum,
      );
      if (existing && existing.loaded && !existing.error) {
        crawlQueueRef.current.delete(chapterNum);
        return;
      }

      // Add loading placeholder (insert in sorted order)
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

      // Rate limiting delay
      await new Promise((r) => setTimeout(r, CRAWL_DELAY));

      const result = await crawlChapter(url, chapterNum);

      if (result) {
        setChapters((prev) =>
          prev.map((ch) => (ch.chapterNumber === chapterNum ? result : ch)),
        );

        // ⚡ Preload images in background so they're browser-cached
        if (
          result.images.length > 0 &&
          !result.error &&
          !preloadedChaptersRef.current.has(chapterNum)
        ) {
          preloadedChaptersRef.current.add(chapterNum);
          preloadImages(result.images);
        }

        // Check if this is the last chapter
        if (!result.nextChapterUrl && result.loaded && !result.error) {
          // Could be the last chapter — but we don't set allChaptersLoaded here
          // because the URL pattern might still work for subsequent chapters
        }

        // Save history
        addToHistory({
          title: comicTitleRef.current,
          slug: extractSlugFromUrl(initialUrl),
          coverUrl: result.images[0]?.src || "",
          lastChapter: result.chapterNumber,
          lastChapterUrl: url,
          sourceUrl: initialUrl,
          maxChapters,
        });
      }

      crawlQueueRef.current.delete(chapterNum);
    },
    [crawlChapter, addToHistory, initialUrl, maxChapters],
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Prefetch upcoming chapters
  // ──────────────────────────────────────────────────────────────────────────
  const prefetchChapters = useCallback(
    (fromChapter: number) => {
      for (let i = 1; i <= PREFETCH_AHEAD; i++) {
        const target = fromChapter + i;

        if (target > maxChapters) {
          if (i === 1) setAllChaptersLoaded(true);
          break;
        }

        // Skip if already loaded/loading
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
        if (crawlQueueRef.current.has(target)) continue;

        // Get URL
        const url =
          chapterUrlMapRef.current.get(target) ||
          `${initialUrl.replace(/chuong-\d+.*$/, "")}chuong-${target}`;

        fetchAndAddChapter(target, url);
      }
    },
    [maxChapters, initialUrl, fetchAndAddChapter],
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Load initial chapter
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialUrl || chapters.length > 0) return;

    const match = initialUrl.match(/chuong-(\d+)/i);
    const startNum = match ? parseInt(match[1], 10) : 1;

    chapterUrlMapRef.current.set(startNum, initialUrl);

    setChapters([
      {
        chapterNumber: startNum,
        chapterTitle: `Chương ${startNum}`,
        images: [],
        loaded: false,
        loading: true,
        error: null,
        nextChapterUrl: null,
      },
    ]);

    (async () => {
      const result = await crawlChapter(initialUrl, startNum);
      if (result) {
        const slug = extractSlugFromUrl(initialUrl);
        const title = slug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        setComicTitle(title);
        comicTitleRef.current = title;
        setChapters([result]);
        setCurrentVisibleChapter(startNum);

        addToHistory({
          title,
          slug,
          coverUrl: result.images[0]?.src || "",
          lastChapter: startNum,
          lastChapterUrl: initialUrl,
          sourceUrl: initialUrl,
          maxChapters,
        });

        // Prefetch next chapters after a short delay
        setTimeout(() => prefetchChapters(startNum), 500);

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
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  // ──────────────────────────────────────────────────────────────────────────
  // When current chapter changes → prefetch more
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentVisibleChapter > 0 && chapters.length > 0) {
      prefetchChapters(currentVisibleChapter);
    }
  }, [currentVisibleChapter, prefetchChapters, chapters.length]);

  // ──────────────────────────────────────────────────────────────────────────
  // Scroll tracking: progress bar + current visible chapter
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        // Progress
        const scrollTop = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        setProgress(
          docHeight > 0
            ? Math.min(100, Math.round((scrollTop / docHeight) * 100))
            : 0,
        );

        // Find current visible chapter
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
  // Height measurement callback (for virtualization placeholders)
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

  // ──────────────────────────────────────────────────────────────────────────
  // Determine which chapters should be virtualized
  // Simple rule: virtualize chapters more than VIRTUALIZE_DISTANCE away
  // from current visible chapter, AND only if we have a saved height for them
  // ──────────────────────────────────────────────────────────────────────────
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
      const url =
        chapterUrlMapRef.current.get(chapterNum) ||
        `${initialUrl.replace(/chuong-\d+.*$/, "")}chuong-${chapterNum}`;
      crawlQueueRef.current.delete(chapterNum);
      fetchAndAddChapter(chapterNum, url);
    },
    [initialUrl, fetchAndAddChapter],
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Failed image tracking
  // ──────────────────────────────────────────────────────────────────────────
  const handleImagePermanentFailure = useCallback((info: FailedImageInfo) => {
    setFailedImages((prev) => {
      // Avoid duplicates
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

        {/* All done message */}
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
        maxChapters={maxChapters}
        failedImages={failedImages}
        progress={progress}
      />
    </div>
  );
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
