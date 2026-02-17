// ============================================================================
// Comic & Chapter Types
// ============================================================================

export interface ComicImage {
  src: string;
  alt?: string;
  index: number;
}

export interface ChapterData {
  chapterNumber: number;
  chapterTitle: string;
  images: ComicImage[];
  nextChapterUrl: string | null;
  prevChapterUrl: string | null;
}

export interface ComicInfo {
  title: string;
  slug: string;
  cover: string;
  author: string;
  genres: string[];
  totalChapters: number;
  description: string;
}

// ============================================================================
// Reader State Types
// ============================================================================

export interface ChapterState {
  chapterNumber: number;
  chapterTitle: string;
  images: ComicImage[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  nextChapterUrl: string | null;
}

export interface ReaderState {
  comicTitle: string;
  sourceUrl: string;
  maxChapters: number;
  chapters: ChapterState[];
  currentChapter: number;
  isHeaderVisible: boolean;
}

// ============================================================================
// Reading History (localStorage)
// ============================================================================

export interface ReadingHistoryItem {
  id: string; // unique id
  title: string;
  slug: string;
  coverUrl: string;
  lastChapter: number;
  lastChapterUrl: string;
  lastReadAt: number; // timestamp
  sourceUrl: string;
  maxChapters: number;
}

// ============================================================================
// API Types
// ============================================================================

export interface CrawlRequest {
  url: string;
}

export interface CrawlResponse {
  success: boolean;
  data?: ChapterData;
  error?: string;
}

export interface ProxyImageRequest {
  url: string;
}
