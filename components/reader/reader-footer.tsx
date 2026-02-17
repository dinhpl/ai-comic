"use client";

import { useState } from "react";
import {
  IconRefresh,
  IconAlertTriangle,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconList,
  IconSettings,
} from "@tabler/icons-react";
import type { FailedImageInfo } from "./comic-image";

interface ReaderFooterProps {
  currentChapter: number;
  maxChapters: number;
  failedImages: FailedImageInfo[];
  progress: number;
  onOpenChapterSelector: () => void;
  onNavigateChapter: (chapterNumber: number) => void;
  onOpenSettings: () => void;
}

export function ReaderFooter({
  currentChapter,
  maxChapters,
  failedImages,
  progress,
  onOpenChapterSelector,
  onNavigateChapter,
  onOpenSettings,
}: ReaderFooterProps) {
  const [showDialog, setShowDialog] = useState(false);

  const handleReload = () => {
    sessionStorage.setItem("reload-to-chapter", String(currentChapter));
    window.location.reload();
  };

  const hasPrev = currentChapter > 1;
  const hasNext = maxChapters > 9000 || currentChapter < maxChapters;

  return (
    <>
      {/* Progress bar at very top */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-muted/30">
        <div
          className="h-full gradient-coral transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Fixed footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 safe-area-bottom">
        <div className="max-w-3xl mx-auto px-3 py-2">
          {/* Main controls row */}
          <div className="flex items-center gap-2">
            {/* Prev chapter */}
            <button
              onClick={() => hasPrev && onNavigateChapter(currentChapter - 1)}
              disabled={!hasPrev}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
              aria-label="Chương trước"
            >
              <IconChevronLeft size={18} />
            </button>

            {/* Chapter selector trigger (center) */}
            <button
              onClick={onOpenChapterSelector}
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-muted/50 hover:bg-muted active:scale-[0.98] transition-all"
            >
              <IconList size={14} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">
                Ch. {currentChapter}
              </span>
              <span className="text-xs text-muted-foreground">
                / {maxChapters > 9000 ? "∞" : maxChapters}
              </span>
            </button>

            {/* Next chapter */}
            <button
              onClick={() => hasNext && onNavigateChapter(currentChapter + 1)}
              disabled={!hasNext}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
              aria-label="Chương tiếp"
            >
              <IconChevronRight size={18} />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground active:scale-95 transition-all"
              aria-label="Cài đặt"
            >
              <IconSettings size={18} />
            </button>

            {/* Reload */}
            <button
              onClick={handleReload}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground active:scale-95 transition-all"
              aria-label="Reload"
            >
              <IconRefresh size={16} />
            </button>

            {/* Failed images badge */}
            {failedImages.length > 0 && (
              <button
                onClick={() => setShowDialog(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-95 transition-all relative"
                aria-label="Ảnh lỗi"
              >
                <IconAlertTriangle size={16} />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">
                  {failedImages.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Failed images dialog */}
      {showDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          onClick={() => setShowDialog(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-background rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <IconAlertTriangle size={16} className="text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Ảnh tải lỗi
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {failedImages.length} ảnh không tải được sau 5 lần thử
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDialog(false)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              >
                <IconX size={16} className="text-muted-foreground" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              {failedImages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Không có ảnh lỗi
                </p>
              ) : (
                <ul className="divide-y divide-border/30">
                  {failedImages.map((img, idx) => (
                    <li
                      key={`${img.chapterNumber}-${img.imageIndex}-${idx}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-destructive/5 flex items-center justify-center">
                        <span className="text-xs font-bold text-destructive">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          Chương {img.chapterNumber} — Trang{" "}
                          {img.imageIndex + 1}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {img.src}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-4 py-3 border-t border-border/50 bg-muted/20">
              <button
                onClick={() => setShowDialog(false)}
                className="w-full py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 active:scale-[0.98] transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
