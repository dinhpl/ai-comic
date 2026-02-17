"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const { threshold = 0, rootMargin = "200px 0px" } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLDivElement | null>(null);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      targetRef.current = node;

      if (!node) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsIntersecting(entry.isIntersecting);
        },
        { threshold, rootMargin }
      );

      observer.observe(node);

      return () => observer.disconnect();
    },
    [threshold, rootMargin]
  );

  return { ref: setRef, isIntersecting };
}
