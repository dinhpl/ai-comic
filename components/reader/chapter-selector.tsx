"use client";

import { useState, useEffect, useRef } from "react";
import { IconX, IconCheck, IconLoader2 } from "@tabler/icons-react";

interface ChapterInfo {
  chapter_number: number;
}

interface ChapterSelectorProps {
  slug: string;
  currentChapter: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectChapter: (chapterNumber: number) => void;
  loadedChapters: number[]; // chapters already loaded in reader
}

export function ChapterSelector({
  slug,
  currentChapter,
  isOpen,
  onClose,
  onSelectChapter,
  loadedChapters,
}: ChapterSelectorProps) {
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Fetch chapter list when opened
  useEffect(() => {
    if (!isOpen || !slug) return;

    async function fetchChapters() {
      setLoading(true);
      try {
        const res = await fetch(`/api/comics?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (data.success && data.data?.chapters) {
          setChapters(
            (data.data.chapters as number[]).map((n) => ({
              chapter_number: n,
            })),
          );
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    fetchChapters();
  }, [isOpen, slug]);

  // Scroll active chapter into view
  useEffect(() => {
    if (!loading && isOpen && activeRef.current) {
      setTimeout(() => {
        activeRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }, 100);
    }
  }, [loading, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Drawer */}
      <div
        className="relative w-full max-w-lg bg-background rounded-t-2xl shadow-2xl border-t border-border/50 animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "70dvh" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border/40">
          <div>
            <h3 className="text-base font-bold text-foreground">Chọn chương</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {chapters.length} chương có sẵn
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <IconX size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Chapter list */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight: "calc(70dvh - 80px)" }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2
                size={20}
                className="text-muted-foreground animate-spin"
              />
              <span className="text-sm text-muted-foreground ml-2">
                Đang tải...
              </span>
            </div>
          ) : chapters.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Không có chương nào
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-1.5 p-3">
              {chapters.map((ch) => {
                const isCurrent = ch.chapter_number === currentChapter;
                const isLoaded = loadedChapters.includes(ch.chapter_number);

                return (
                  <button
                    key={ch.chapter_number}
                    ref={isCurrent ? activeRef : undefined}
                    onClick={() => {
                      onSelectChapter(ch.chapter_number);
                      onClose();
                    }}
                    className={`relative flex items-center justify-center h-11 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
                      isCurrent
                        ? "gradient-coral text-white shadow-md shadow-orange-500/20"
                        : isLoaded
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-muted/50 text-foreground hover:bg-muted"
                    }`}
                  >
                    {ch.chapter_number}
                    {isCurrent && (
                      <IconCheck
                        size={10}
                        className="absolute top-1 right-1 text-white/80"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
