"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconBook, IconLoader2, IconAlertCircle } from "@tabler/icons-react";

interface Comic {
  id: number;
  slug: string;
  title: string;
  cover_url: string | null;
  total_chapters: number;
  updated_at: string;
  first_chapter: number;
}

export function ComicLibrary() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchComics() {
      try {
        const res = await fetch("/api/comics");
        const data = await res.json();
        if (data.success) {
          setComics(data.data);
        } else {
          setError(data.error || "Lỗi tải danh sách truyện");
        }
      } catch {
        setError("Không thể kết nối đến server");
      } finally {
        setLoading(false);
      }
    }
    fetchComics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconLoader2 size={20} className="text-muted-foreground animate-spin" />
        <span className="text-sm text-muted-foreground ml-2">
          Đang tải thư viện...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-6 px-4 bg-destructive/5 rounded-xl border border-destructive/20">
        <IconAlertCircle size={18} className="text-destructive shrink-0" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (comics.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-muted/50 flex items-center justify-center">
          <IconBook size={24} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Chưa có truyện nào
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Chạy{" "}
          <code className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
            pnpm crawl
          </code>{" "}
          để thêm truyện
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comics.map((comic) => (
        <button
          key={comic.id}
          onClick={() =>
            router.push(
              `/read?slug=${comic.slug}&chapter=${comic.first_chapter}`,
            )
          }
          className="w-full flex items-center gap-3 p-3 bg-card hover:bg-accent/50 rounded-xl border border-border/50 transition-all duration-200 active:scale-[0.98] text-left shadow-sm hover:shadow-md"
        >
          {/* Cover thumbnail */}
          <div className="w-14 h-18 rounded-lg overflow-hidden bg-muted shrink-0 relative">
            {comic.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/proxy-image?url=${encodeURIComponent(comic.cover_url)}`}
                alt={comic.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <IconBook size={20} className="text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {comic.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {comic.total_chapters} chương
              </span>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(comic.updated_at)}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className="shrink-0 text-muted-foreground/40">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}
