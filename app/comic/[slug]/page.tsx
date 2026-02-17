"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  IconChevronLeft,
  IconBook,
  IconLoader2,
  IconAlertCircle,
  IconPlayerPlayFilled,
  IconCheck,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

interface Chapter {
  chapter_number: number;
  chapter_title: string;
  created_at: string;
}

interface ComicDetail {
  id: number;
  slug: string;
  title: string;
  cover_url: string | null;
  total_chapters: number;
  chapters: Chapter[];
}

export default function ComicDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fetchInProgress = useRef(false);

  const [comic, setComic] = useState<ComicDetail | null>(null);
  const [readChapters, setReadChapters] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function fetchData() {
      if (fetchInProgress.current) return;

      try {
        fetchInProgress.current = true;
        setLoading(true);
        setError(null);

        // 1. Fetch comic detail
        const res = await fetch(`/api/comics/${slug}`);
        const result = await res.json();

        if (!result.success) {
          setError(result.error);
          setLoading(false);
          return;
        }

        const comicData = result.data;
        setComic(comicData);
        // Progressive loading: Show comic info first
        setLoading(false);

        // 2. Fetch read status if user is logged in
        if (user) {
          const supabase = getSupabase();
          const { data: readData } = await supabase
            .from("user_read_chapters")
            .select("chapter_number")
            .eq("user_id", user.id)
            .eq("comic_id", comicData.id);

          if (readData) {
            setReadChapters(new Set(readData.map((r) => r.chapter_number)));
          }
        }
      } catch (err) {
        setError("Không thể tải thông tin truyện");
        setLoading(false);
      } finally {
        fetchInProgress.current = false;
      }
    }

    if (slug && !authLoading) {
      fetchData();
    }
  }, [slug, user?.id, authLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="relative">
          <IconLoader2 className="animate-spin text-primary/20" size={48} />
          <IconBook
            className="absolute inset-0 m-auto text-primary"
            size={20}
          />
        </div>
        <p className="mt-4 text-xs font-bold text-muted-foreground animate-pulse uppercase tracking-widest">
          Đang tải dữ liệu...
        </p>
      </div>
    );
  }

  if (error || !comic) {
    return (
      <div className="min-h-screen bg-background p-6">
        <button
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <IconChevronLeft size={20} /> Quay lại
        </button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <IconAlertCircle size={48} className="text-destructive mb-4" />
          <p className="text-lg font-bold">
            {error || "Không tìm thấy truyện"}
          </p>
        </div>
      </div>
    );
  }

  const sortedChapters = [...comic.chapters].sort((a, b) => {
    return sortOrder === "desc"
      ? b.chapter_number - a.chapter_number
      : a.chapter_number - b.chapter_number;
  });

  const lastChapter =
    comic.chapters.length > 0
      ? comic.chapters[comic.chapters.length - 1]
      : null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95"
          >
            <IconChevronLeft size={20} />
          </button>
          <h1 className="text-sm font-bold truncate flex-1">{comic.title}</h1>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 pt-6">
        {/* Comic Hero */}
        <div className="flex flex-col sm:flex-row gap-6 mb-10">
          <div className="w-40 sm:w-36 aspect-[3/4] rounded-2xl overflow-hidden bg-muted shadow-2xl shrink-0 border border-border/20 mx-auto sm:mx-0">
            {comic.cover_url ? (
              <img
                src={`/api/proxy-image?url=${encodeURIComponent(comic.cover_url)}`}
                alt={comic.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <IconBook size={32} className="text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center sm:justify-end py-2 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-3">
              {comic.title}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-3 text-sm text-muted-foreground">
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg font-bold">
                {comic.total_chapters} Chương
              </span>
              {lastChapter && (
                <span className="text-xs">
                  Cập nhật:{" "}
                  {new Date(lastChapter.created_at).toLocaleDateString("vi-VN")}
                </span>
              )}
            </div>
            <button
              onClick={() => router.push(`/read?slug=${comic.slug}&chapter=1`)}
              className="mt-6 w-full sm:w-fit px-8 py-3.5 rounded-2xl gradient-coral text-white font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <IconPlayerPlayFilled size={16} />
              Đọc ngay
            </button>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <h3 className="text-xl font-black italic tracking-tighter uppercase">
              Danh sách chương
            </h3>
            <button
              onClick={() =>
                setSortOrder(sortOrder === "desc" ? "asc" : "desc")
              }
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            >
              {sortOrder === "desc" ? (
                <>
                  <IconSortDescending size={14} /> Mới nhất
                </>
              ) : (
                <>
                  <IconSortAscending size={14} /> Cũ nhất
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {sortedChapters.map((ch) => {
              const isRead = readChapters.has(ch.chapter_number);
              return (
                <button
                  key={ch.chapter_number}
                  onClick={() =>
                    router.push(
                      `/read?slug=${comic.slug}&chapter=${ch.chapter_number}`,
                    )
                  }
                  className={`group relative flex flex-col items-center justify-center aspect-square sm:aspect-video rounded-2xl border transition-all text-center active:scale-[0.96] ${
                    isRead
                      ? "bg-muted/40 border-border/30"
                      : "bg-card border-border/60 hover:border-primary/50 hover:shadow-md"
                  }`}
                >
                  <span
                    className={`text-xl font-black leading-none ${isRead ? "text-muted-foreground/50" : "text-foreground"}`}
                  >
                    {ch.chapter_number}
                  </span>
                  <span className="text-[10px] uppercase tracking-tighter font-bold text-muted-foreground/40 mt-1">
                    Chap
                  </span>

                  {isRead && (
                    <div className="absolute top-2 right-2 text-green-500">
                      <IconCheck size={14} strokeWidth={4} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
