"use client";

import { useEffect, useState } from "react";
import {
  IconBookFilled,
  IconMoonFilled,
  IconSunFilled,
} from "@tabler/icons-react";

export function HeaderBar() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem("theme");
    if (
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-coral flex items-center justify-center shadow-sm">
            <IconBookFilled size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight tracking-tight">
              Đọc Truyện
            </h1>
            <p className="text-[10px] text-muted-foreground leading-none font-medium">
              Mobile Reader
            </p>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDark}
          className="touch-target flex items-center justify-center w-10 h-10 rounded-xl hover:bg-secondary transition-colors active:scale-95"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <IconSunFilled size={20} className="text-amber-400" />
          ) : (
            <IconMoonFilled size={20} className="text-muted-foreground" />
          )}
        </button>
      </div>
    </header>
  );
}
