"use client";

import { useState, useEffect, useRef } from "react";

export function useScrollDirection() {
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const diff = currentScrollY - lastScrollY.current;

          // Only toggle after significant scroll (10px threshold)
          if (Math.abs(diff) > 10) {
            const scrollingDown = diff > 0;
            setIsScrollingDown(scrollingDown);

            // Show header/footer when scrolling up or at top
            if (currentScrollY < 50) {
              setIsVisible(true);
            } else {
              setIsVisible(!scrollingDown);
            }
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleVisible = () => setIsVisible((v) => !v);

  return { isScrollingDown, isVisible, toggleVisible };
}
