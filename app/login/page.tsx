"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (error) {
        setError(error.message || "登录失败");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("登录过程中发生错误");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img 
              src="/images/icon.svg" 
              alt="Bilibili 无限历史记录 Logo"
              className="w-8 h-8"
            />
            <Link href="/" className="text-xl font-bold text-[#00a1d6]">
              Bilibili 无限历史记录
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              href="https://v3oxu28gnc.feishu.cn/docx/MZp8dCXd1otO9oxevQUcIlxFnPg?from=from_copylink"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-[#00a1d6] font-medium transition-colors"
            >
              文档
            </Link>
            <Link
              href="https://c1p0xw7om7n.feishu.cn/share/base/form/shrcneS0t8RdC3byY9xC5ftQgub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-[#00a1d6] font-medium transition-colors"
            >
              提交建议
            </Link>
            <Link
              href="/register"
              className="bg-[#00a1d6] hover:bg-[#0076a8] text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              注册
            </Link>
          </div>
        </div>
      </nav>

      {/* 登录表单区域 */}
      <div className="flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              登录账户
            </CardTitle>
            <p className="text-sm text-gray-600 text-center">
              输入您的邮箱和密码来登录
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
              <Button
                type="submit"
                className="w-full bg-[#00a1d6] hover:bg-[#0076a8]"
                disabled={isLoading}
              >
                {isLoading ? "登录中..." : "登录"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                还没有账户？{" "}
                <Link
                  href="/register"
                  className="text-[#00a1d6] hover:underline font-medium"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
