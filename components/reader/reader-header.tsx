"use client";

import { IconArrowLeft, IconDotsVertical } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface ReaderHeaderProps {
  title: string;
  currentChapter: number;
  isVisible: boolean;
}

export function ReaderHeader({
  title,
  currentChapter,
  isVisible,
}: ReaderHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 glass border-b border-border/30 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-3xl mx-auto px-3 h-12 flex items-center gap-2">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="touch-target flex items-center justify-center w-9 h-9 rounded-xl hover:bg-secondary transition-colors active:scale-95 flex-shrink-0"
          aria-label="Quay lại"
        >
          <IconArrowLeft size={20} />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0 text-center">
          <h1 className="text-sm font-bold truncate">{title}</h1>
          <p className="text-[10px] text-muted-foreground leading-none">
            Chương {currentChapter}
          </p>
        </div>

        {/* Menu */}
        <button
          className="touch-target flex items-center justify-center w-9 h-9 rounded-xl hover:bg-secondary transition-colors active:scale-95 flex-shrink-0"
          aria-label="Menu"
        >
          <IconDotsVertical size={18} />
        </button>
      </div>
    </header>
  );
}
