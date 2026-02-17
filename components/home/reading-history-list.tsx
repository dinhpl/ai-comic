"use client";

import { useRouter } from "next/navigation";
import type { ReadingHistoryItem } from "@/lib/types";
import { IconTrash, IconClock } from "@tabler/icons-react";

interface ReadingHistoryListProps {
  history: ReadingHistoryItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function ReadingHistoryList({
  history,
  onRemove,
  onClear,
}: ReadingHistoryListProps) {
  const router = useRouter();

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-muted/60 flex items-center justify-center">
          <IconClock size={28} className="text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground">Chưa có lịch sử đọc nào</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Nhập URL truyện ở trên để bắt đầu
        </p>
      </div>
    );
  }

  const handleItemClick = (item: ReadingHistoryItem) => {
    if (item.slug) {
      router.push(
        `/read?slug=${encodeURIComponent(item.slug)}&chapter=${item.lastChapter}`,
      );
    } else {
      const params = new URLSearchParams({
        url: item.lastChapterUrl,
        max: String(item.maxChapters),
      });
      router.push(`/read?${params.toString()}`);
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(timestamp).toLocaleDateString("vi-VN");
  };

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground">📚 Lịch sử đọc</h2>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
          >
            <IconTrash size={12} />
            Xóa tất cả
          </button>
        )}
      </div>

      {/* History Items */}
      <div className="space-y-2">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-sm active:scale-[0.99] transition-all text-left group"
          >
            {/* Cover */}
            <div className="w-12 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0 skeleton-shimmer">
              {item.coverUrl ? (
                <img
                  src={`/api/proxy-image?url=${encodeURIComponent(item.coverUrl)}`}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onLoad={(e) => {
                    (e.target as HTMLElement).parentElement?.classList.remove(
                      "skeleton-shimmer",
                    );
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg">
                  📖
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chương {item.lastChapter}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                <IconClock size={10} />
                {formatTime(item.lastReadAt)}
              </p>
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
              aria-label="Xóa"
            >
              <IconTrash
                size={14}
                className="text-muted-foreground hover:text-destructive"
              />
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
