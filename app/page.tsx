"use client";

import { HeaderBar } from "@/components/home/header-bar";
import { UrlInputForm } from "@/components/home/url-input-form";
import { ContinueReadingCard } from "@/components/home/continue-reading-card";
import { ReadingHistoryList } from "@/components/home/reading-history-list";
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
              Dán link truyện tranh vào bên dưới để bắt đầu đọc
            </p>
          </div>

          {/* URL Input Form */}
          <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
            <UrlInputForm />
          </div>

          {/* Continue Reading Card */}
          {lastRead && (
            <div className="mt-5 animate-fade-in-up">
              <ContinueReadingCard item={lastRead} />
            </div>
          )}

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
              Hỗ trợ URL từ nhattruyenqq.com và các trang tương tự
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
