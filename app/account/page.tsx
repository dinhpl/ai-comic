"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  IconChevronLeft,
  IconUser,
  IconMail,
  IconLogout,
  IconCalendar,
} from "@tabler/icons-react";

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b border-border/50 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">Tài khoản</h1>
        </div>
      </div>

      <main className="max-w-lg mx-auto p-4 space-y-6">
        {/* Profile Card */}
        <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary border-4 border-background mb-4 text-4xl shadow-inner">
            <IconUser size={48} />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {user.user_metadata?.full_name || "Thành viên"}
          </h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        {/* Info list */}
        <div className="bg-card rounded-3xl border border-border/50 divide-y divide-border/30 overflow-hidden shadow-sm">
          <div className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <IconMail size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">
                Email
              </p>
              <p className="text-sm font-medium truncate">{user.email}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <IconCalendar size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">
                Ngày tham gia
              </p>
              <p className="text-sm font-medium">
                {new Date(user.created_at).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-destructive/10 text-destructive font-bold text-sm hover:bg-destructive/20 active:scale-[0.98] transition-all"
        >
          <IconLogout size={20} />
          Đăng xuất khỏi thiết bị
        </button>

        <p className="text-center text-[10px] text-muted-foreground/40 px-8">
          Mọi dữ liệu lịch sử đọc và cấu hình sẽ được đồng bộ hóa với tài khoản
          Supabase của bạn.
        </p>
      </main>
    </div>
  );
}
