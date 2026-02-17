"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconLink,
  IconHash,
  IconPlayerPlayFilled,
  IconLoader2,
} from "@tabler/icons-react";

export function UrlInputForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [maxChapters, setMaxChapters] = useState("50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError("Vui lòng nhập URL truyện");
      return;
    }

    // Basic URL validation
    if (
      !trimmedUrl.includes("truyen-tranh") ||
      !trimmedUrl.includes("chuong")
    ) {
      setError(
        "URL không đúng định dạng. Ví dụ: https://nhattruyenqq.com/truyen-tranh/ten-truyen/chuong-1",
      );
      return;
    }

    const chapNum = parseInt(maxChapters, 10);
    if (isNaN(chapNum) || chapNum < 1) {
      setError("Số chương phải lớn hơn 0");
      return;
    }

    setLoading(true);

    // Navigate to reader page
    const params = new URLSearchParams({
      url: trimmedUrl,
      max: String(chapNum),
    });
    router.push(`/read?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* URL Input */}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <IconLink size={18} className="text-muted-foreground" />
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          placeholder="Dán link chương truyện vào đây..."
          className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      {/* Max Chapters Input */}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <IconHash size={18} className="text-muted-foreground" />
        </div>
        <input
          type="number"
          value={maxChapters}
          onChange={(e) => setMaxChapters(e.target.value)}
          placeholder="Số chương tối đa"
          min="1"
          max="9999"
          className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          chương
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium animate-fade-in-up">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl gradient-coral text-white font-semibold text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <IconLoader2 size={18} className="animate-spin" />
            Đang tải...
          </>
        ) : (
          <>
            <IconPlayerPlayFilled size={16} />
            Bắt Đầu Đọc
          </>
        )}
      </button>
    </form>
  );
}
