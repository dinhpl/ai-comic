"use client";

import { useState } from "react";
import { IconRefresh, IconAlertTriangle, IconX } from "@tabler/icons-react";
import type { FailedImageInfo } from "./comic-image";

interface ReaderFooterProps {
  currentChapter: number;
  maxChapters: number;
  failedImages: FailedImageInfo[];
  progress: number;
}

export function ReaderFooter({
  currentChapter,
  maxChapters,
  failedImages,
  progress,
}: ReaderFooterProps) {
  const [showDialog, setShowDialog] = useState(false);

  const handleReload = () => {
    // Save current chapter to sessionStorage so we can scroll back after reload
    sessionStorage.setItem("reload-to-chapter", String(currentChapter));
    window.location.reload();
  };

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
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border/50 safe-area-bottom">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-2">
          {/* Chapter info */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground">
              Ch. {currentChapter}
            </span>
            <span className="text-xs text-muted-foreground">
              / {maxChapters > 9000 ? "∞" : maxChapters}
            </span>
          </div>

          {/* Reload button */}
          <button
            onClick={handleReload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-foreground text-xs font-medium active:scale-95 transition-all"
            aria-label="Reload trang"
          >
            <IconRefresh size={14} />
            Reload
          </button>

          {/* Failed images counter */}
          <button
            onClick={() => failedImages.length > 0 && setShowDialog(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              failedImages.length > 0
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-95 cursor-pointer"
                : "bg-muted/30 text-muted-foreground cursor-default"
            }`}
            disabled={failedImages.length === 0}
          >
            <IconAlertTriangle size={14} />
            {failedImages.length > 0 ? `${failedImages.length} lỗi` : "0 lỗi"}
          </button>
        </div>
      </footer>

      {/* Failed images dialog */}
      {showDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          onClick={() => setShowDialog(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Dialog */}
          <div
            className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-background rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
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

            {/* List */}
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

            {/* Footer */}
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
