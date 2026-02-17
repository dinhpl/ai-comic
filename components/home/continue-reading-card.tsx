"use client";

import { useRouter } from "next/navigation";
import type { ReadingHistoryItem } from "@/lib/types";
import { IconChevronRight } from "@tabler/icons-react";

interface ContinueReadingCardProps {
  item: ReadingHistoryItem;
}

export function ContinueReadingCard({ item }: ContinueReadingCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (item.slug) {
      router.push(
        `/read?slug=${encodeURIComponent(item.slug)}&chapter=${item.lastChapter}`,
      );
    } else {
      // Legacy fallback
      const params = new URLSearchParams({
        url: item.lastChapterUrl,
        max: String(item.maxChapters),
      });
      router.push(`/read?${params.toString()}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full gradient-coral rounded-2xl p-4 text-left shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] transition-all group"
    >
      <p className="text-white/80 text-xs font-medium mb-2">📖 Tiếp tục đọc</p>

      <div className="flex items-center gap-3">
        {/* Cover thumbnail */}
        <div className="w-12 h-12 rounded-xl bg-white/20 overflow-hidden flex-shrink-0">
          {item.coverUrl ? (
            <img
              src={`/api/proxy-image?url=${encodeURIComponent(item.coverUrl)}`}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/60 text-lg">
              📚
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm truncate">
            {item.title}
          </h3>
          <p className="text-white/70 text-xs mt-0.5">
            Chương {item.lastChapter}
          </p>
        </div>

        {/* Arrow */}
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <IconChevronRight size={16} className="text-white" />
        </div>
      </div>
    </button>
  );
}
