"use client";

import { IconX, IconSettings, IconMinus, IconPlus } from "@tabler/icons-react";
import { ReaderSettings as SettingsType } from "@/hooks/use-reader-settings";

interface ReaderSettingsProps {
  settings: SettingsType;
  updateSettings: (newSettings: Partial<SettingsType>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ReaderSettings({
  settings,
  updateSettings,
  isOpen,
  onClose,
}: ReaderSettingsProps) {
  if (!isOpen) return null;

  const handleAdjust = (key: keyof SettingsType, delta: number) => {
    const val = settings[key] + delta;
    if (val < 1) return;
    if (key === "prefetchAhead" && val > 10) return;
    if (key === "maxRetries" && val > 10) return;
    updateSettings({ [key]: val });
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Drawer */}
      <div
        className="relative w-full max-w-lg bg-background rounded-t-2xl shadow-2xl border-t border-border/50 animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <IconSettings size={18} className="text-muted-foreground" />
            <h3 className="text-base font-bold text-foreground">
              Cấu hình đọc
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <IconX size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 pb-12">
          {/* Prefetch setting */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Tải trước chương
              </p>
              <p className="text-[11px] text-muted-foreground">
                Số chương được tải trước tự động
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAdjust("prefetchAhead", -1)}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-all"
              >
                <IconMinus size={14} />
              </button>
              <span className="text-sm font-bold min-w-[1.5rem] text-center">
                {settings.prefetchAhead}
              </span>
              <button
                onClick={() => handleAdjust("prefetchAhead", 1)}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-all"
              >
                <IconPlus size={14} />
              </button>
            </div>
          </div>

          {/* Max retries setting */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Số lần tải lại ảnh
              </p>
              <p className="text-[11px] text-muted-foreground">
                Tự động tải lại khi ảnh lỗi
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAdjust("maxRetries", -1)}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-all"
              >
                <IconMinus size={14} />
              </button>
              <span className="text-sm font-bold min-w-[1.5rem] text-center">
                {settings.maxRetries}
              </span>
              <button
                onClick={() => handleAdjust("maxRetries", 1)}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-all"
              >
                <IconPlus size={14} />
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
            <p className="text-[10px] text-orange-600 leading-relaxed italic">
              * Thay đổi "Số lần tải lại ảnh" sẽ có hiệu lực cho các chương tải
              mới sau khi chỉnh sửa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
