"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-3xl shadow-xl flex items-center justify-center text-3xl">
          📖
        </div>
        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-rose-500">
          RenderTruyen
        </h1>
      </div>

      {message && (
        <div className="mb-6 max-w-md w-full p-4 text-sm bg-green-500/10 text-green-600 rounded-2xl border border-green-500/20 text-center animate-fade-in">
          {message}
        </div>
      )}

      <AuthForm mode="login" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
