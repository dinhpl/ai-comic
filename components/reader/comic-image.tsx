"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { IconPhotoOff } from "@tabler/icons-react";

export interface FailedImageInfo {
  chapterNumber: number;
  imageIndex: number; // 0-based
  src: string;
}

interface ComicImageProps {
  src: string;
  alt: string;
  index: number;
  chapterNumber: number;
  onPermanentFailure?: (info: FailedImageInfo) => void;
  onFailureResolved?: (info: FailedImageInfo) => void;
}

const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 3000, 5000, 8000];

export function ComicImage({
  src,
  alt,
  index,
  chapterNumber,
  onPermanentFailure,
  onFailureResolved,
}: ComicImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const reportedFailureRef = useRef(false);

  const proxiedSrc =
    `/api/proxy-image?url=${encodeURIComponent(src)}` +
    (retryCount > 0 ? `&_r=${retryCount}` : "");

  const scheduleRetry = useCallback(() => {
    if (retryCount >= MAX_RETRIES) {
      // Report permanent failure
      if (!reportedFailureRef.current && onPermanentFailure) {
        reportedFailureRef.current = true;
        onPermanentFailure({ chapterNumber, imageIndex: index, src });
      }
      return;
    }

    const delay = RETRY_DELAYS[retryCount] || 5000;
    setRetrying(true);

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setError(false);
      setLoaded(false);
      setRetrying(false);
      setRetryCount((prev) => prev + 1);
    }, delay);
  }, [retryCount, chapterNumber, index, src, onPermanentFailure]);

  const handleError = useCallback(() => {
    setError(true);
    setLoaded(false);
    scheduleRetry();
  }, [scheduleRetry]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setError(false);
    setRetrying(false);
    // If it previously failed but now loaded, resolve the failure
    if (reportedFailureRef.current && onFailureResolved) {
      reportedFailureRef.current = false;
      onFailureResolved({ chapterNumber, imageIndex: index, src });
    }
    setRetryCount(0);
  }, [chapterNumber, index, src, onFailureResolved]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Permanent failure
  if (error && retryCount >= MAX_RETRIES && !retrying) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-10 bg-muted/30 gap-2">
        <IconPhotoOff size={28} className="text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">
          Trang {index + 1} - Không tải được sau {MAX_RETRIES} lần thử
        </p>
        <button
          onClick={() => {
            // Resolve previous failure report
            if (reportedFailureRef.current && onFailureResolved) {
              reportedFailureRef.current = false;
              onFailureResolved({ chapterNumber, imageIndex: index, src });
            }
            setRetryCount(0);
            setError(false);
            setLoaded(false);
          }}
          className="mt-1 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 active:scale-95 transition-all"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {(!loaded || retrying) && !error && (
        <div className="w-full aspect-2/3 skeleton-shimmer rounded-sm" />
      )}

      {error && retrying && (
        <div className="w-full aspect-2/3 skeleton-shimmer rounded-sm flex items-center justify-center">
          <p className="text-[10px] text-muted-foreground/60 absolute">
            Đang thử lại ({retryCount + 1}/{MAX_RETRIES})...
          </p>
        </div>
      )}

      {!error && (
        <img
          key={`${src}-${retryCount}`}
          src={proxiedSrc}
          alt={alt}
          loading="eager"
          className={`w-full h-auto block transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0 absolute top-0 left-0"
          }`}
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
        />
      )}
    </div>
  );
}
