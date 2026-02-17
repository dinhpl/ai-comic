"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import {
  IconUser,
  IconLogout,
  IconLogin,
  IconUserPlus,
  IconChevronRight,
} from "@tabler/icons-react";

export function UserButton() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="w-full h-16 rounded-3xl bg-card border border-border/50 skeleton-shimmer" />
    );
  }

  if (!user) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => router.push("/login")}
          className="flex-1 py-3 px-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all flex items-center justify-center gap-2 text-sm font-bold text-foreground"
        >
          <IconLogin size={18} className="text-primary" />
          Đăng nhập
        </button>
        <button
          onClick={() => router.push("/register")}
          className="flex-1 py-3 px-4 rounded-2xl gradient-coral text-white shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 text-sm font-bold"
        >
          <IconUserPlus size={18} />
          Đăng ký
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-4 rounded-3xl bg-card border border-border/50 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <IconUser size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">
            Chào mừng trở lại,
          </p>
          <p className="text-sm font-bold text-foreground truncate">
            {user.user_metadata?.full_name || user.email}
          </p>
        </div>
        <button
          onClick={signOut}
          className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all flex items-center justify-center"
          title="Đăng xuất"
        >
          <IconLogout size={18} />
        </button>
      </div>

      <div className="h-px bg-border/40 mx-1" />

      <button
        onClick={() => router.push("/account")}
        className="w-full flex items-center justify-between py-1 px-1 hover:text-primary transition-colors group"
      >
        <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary">
          Quản lý tài khoản
        </span>
        <IconChevronRight
          size={14}
          className="text-muted-foreground/50 group-hover:text-primary"
        />
      </button>
    </div>
  );
}
