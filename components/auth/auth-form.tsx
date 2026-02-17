"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { IconLoader2, IconMail, IconLock, IconUser } from "@tabler/icons-react";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabase();

    try {
      if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (signUpError) throw signUpError;
        router.push("/login?message=Kiểm tra email để xác nhận đăng ký");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-8 bg-card rounded-3xl border border-border/50 shadow-xl">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === "login"
            ? "Đăng nhập để đồng bộ lịch sử đọc của bạn"
            : "Đăng ký để hưởng các đặc quyền cá nhân hóa"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground ml-1">
              Họ và tên
            </label>
            <div className="relative group">
              <IconUser
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
              />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/50 rounded-xl outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground ml-1">
            Email
          </label>
          <div className="relative group">
            <IconMail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/50 rounded-xl outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground ml-1">
            Mật khẩu
          </label>
          <div className="relative group">
            <IconLock
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/50 rounded-xl outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-xl border border-destructive/20 animate-fade-in">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl gradient-coral text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:pointer-events-none"
        >
          {loading ? (
            <IconLoader2 size={18} className="animate-spin" />
          ) : mode === "login" ? (
            "Đăng nhập ngay"
          ) : (
            "Đăng ký tài khoản"
          )}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={() => router.push(mode === "login" ? "/register" : "/login")}
          className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          {mode === "login"
            ? "Chưa có tài khoản? Đăng ký tại đây"
            : "Đã có tài khoản? Đăng nhập tại đây"}
        </button>
      </div>
    </div>
  );
}
