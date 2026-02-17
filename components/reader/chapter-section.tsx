"use client";

import type { ChapterState } from "@/lib/types";
import { ComicImage, type FailedImageInfo } from "./comic-image";
import { ChapterLoading } from "./chapter-loading";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

interface ChapterSectionProps {
  chapter: ChapterState;
  isFirst: boolean;
  onRetry?: () => void;
  isVirtualized: boolean;
  savedHeight: number;
  onHeightMeasured?: (chapterNumber: number, height: number) => void;
  onImagePermanentFailure?: (info: FailedImageInfo) => void;
  onImageFailureResolved?: (info: FailedImageInfo) => void;
}

export function ChapterSection({
  chapter,
  isFirst,
  onRetry,
  isVirtualized,
  savedHeight,
  onHeightMeasured,
  onImagePermanentFailure,
  onImageFailureResolved,
}: ChapterSectionProps) {
  const measureRef = (el: HTMLDivElement | null) => {
    if (el && onHeightMeasured && chapter.loaded && chapter.images.length > 0) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const h = entry.contentRect.height;
          if (h > 100) {
            onHeightMeasured(chapter.chapterNumber, h);
          }
        }
      });
      observer.observe(el);
      return () => observer.disconnect();
    }
  };

  // Loading
  if (chapter.loading) {
    return (
      <div id={`chapter-${chapter.chapterNumber}`}>
        <ChapterLoading chapterNumber={chapter.chapterNumber} />
      </div>
    );
  }

  // Error
  if (chapter.error) {
    return (
      <div id={`chapter-${chapter.chapterNumber}`} className="py-8 px-4">
        <div className="max-w-sm mx-auto text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <IconAlertTriangle size={24} className="text-destructive" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            Lỗi tải chương {chapter.chapterNumber}
          </p>
          <p className="text-xs text-muted-foreground mb-4">{chapter.error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-coral text-white text-sm font-medium hover:shadow-md active:scale-95 transition-all"
            >
              <IconRefresh size={14} />
              Thử lại
            </button>
          )}
        </div>
      </div>
    );
  }

  // Separator
  const separator = !isFirst && <div className="h-px bg-border/20" />;

  // Virtualized placeholder
  if (isVirtualized && savedHeight > 0) {
    return (
      <div
        id={`chapter-${chapter.chapterNumber}`}
        style={{ height: savedHeight }}
        className="relative"
      >
        {separator}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
          <p className="text-xs text-muted-foreground">
            Chương {chapter.chapterNumber} — cuộn lại để xem
          </p>
        </div>
      </div>
    );
  }

  // Normal render
  return (
    <section
      ref={measureRef}
      className="relative"
      id={`chapter-${chapter.chapterNumber}`}
    >
      {separator}

      <div className="flex flex-col">
        {chapter.images.map((image) => (
          <ComicImage
            key={`${chapter.chapterNumber}-${image.index}`}
            src={image.src}
            alt={
              image.alt ||
              `Ch.${chapter.chapterNumber} - Trang ${image.index + 1}`
            }
            index={image.index}
            chapterNumber={chapter.chapterNumber}
            onPermanentFailure={onImagePermanentFailure}
            onFailureResolved={onImageFailureResolved}
          />
        ))}
      </div>

      {/* Chapter end marker */}
      <div className="py-3 text-center">
        <span className="text-[11px] text-muted-foreground/50">
          Hết Chương {chapter.chapterNumber}
        </span>
      </div>
    </section>
  );
}
