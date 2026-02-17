"use client";

import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
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

      <AuthForm mode="register" />
    </div>
  );
}
