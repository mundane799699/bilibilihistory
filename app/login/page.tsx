"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });
      if (error) setError(error.message || "登录失败");
      else router.push("/dashboard");
    } catch {
      setError("登录过程中发生错误");
    } finally {
      setIsLoading(false);
    }
  };

  const field =
    "h-11 w-full rounded-xl border border-border bg-white px-3.5 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/25 focus:ring-4 focus:ring-foreground/5";

  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(251,114,153,0.12),transparent_70%)]"
      />

      <header className="relative mx-auto flex w-full max-w-page items-center justify-between px-6 py-5 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
        <Link
          href="/register"
          className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          还没有账户？<span className="font-medium text-foreground">注册</span>
        </Link>
      </header>

      <main className="relative flex flex-1 items-start justify-center px-6 pb-24 pt-10 lg:pt-16">
        <div className="w-full max-w-[400px]">
          <div className="text-center">
            <img
              src="/images/icon.svg"
              alt="Bilibili 无限历史记录"
              className="mx-auto h-11 w-11"
            />
            <h1 className="mt-6 text-[26px] font-semibold tracking-tight">
              登录账户
            </h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              查看和管理你的全部观看历史
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-9 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[13px] font-medium text-foreground"
              >
                邮箱
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={field}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-[13px] font-medium text-foreground"
              >
                密码
              </label>
              <input
                id="password"
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={field}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isLoading ? "登录中…" : "登录"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-muted-foreground">
            还没有账户？{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              立即注册
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}