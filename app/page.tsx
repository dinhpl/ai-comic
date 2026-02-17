"use client";

import { HeaderBar } from "@/components/home/header-bar";
import { ContinueReadingCard } from "@/components/home/continue-reading-card";
import { ReadingHistoryList } from "@/components/home/reading-history-list";
import { ComicLibrary } from "@/components/home/comic-library";
import { useReadingHistory } from "@/hooks/use-reading-history";
import { Toaster } from "sonner";

export default function HomePage() {
  const { history, removeFromHistory, clearHistory } = useReadingHistory();

  const lastRead = history.length > 0 ? history[0] : null;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          className: "text-sm",
        }}
      />

      <div className="min-h-dvh bg-background">
        <HeaderBar />

        <main className="max-w-lg mx-auto px-4 pb-8">
          {/* Hero Section */}
          <div className="pt-6 pb-4">
            <h2 className="text-xl font-bold tracking-tight">Xin chào! 👋</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Chọn truyện bên dưới để bắt đầu đọc
            </p>
          </div>

          {/* Continue Reading Card */}
          {lastRead && (
            <div className="mb-5 animate-fade-in-up">
              <ContinueReadingCard item={lastRead} />
            </div>
          )}

          {/* Comic Library from Database */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                📚 Thư viện truyện
              </h3>
              <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-full">
                từ database
              </span>
            </div>
            <ComicLibrary />
          </div>

          {/* Reading History */}
          <div className="mt-6">
            <ReadingHistoryList
              history={history}
              onRemove={removeFromHistory}
              onClear={clearHistory}
            />
          </div>

          {/* Footer Hint */}
          <div className="mt-8 text-center">
            <p className="text-[10px] text-muted-foreground/40">
              Dùng{" "}
              <code className="px-1 py-0.5 bg-muted/50 rounded">
                pnpm crawl
              </code>{" "}
              để thêm truyện mới
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
