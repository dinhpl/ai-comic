"use client";

interface ChapterLoadingProps {
  chapterNumber: number;
}

export function ChapterLoading({ chapterNumber }: ChapterLoadingProps) {
  return (
    <div
      className="flex flex-col"
      aria-label={`Đang tải chương ${chapterNumber}`}
    >
      {/* Show skeleton images that look like comic pages loading */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="w-full aspect-2/3 skeleton-shimmer" />
      ))}
    </div>
  );
}
