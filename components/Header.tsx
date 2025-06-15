"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user: any;
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <img src="/images/icon.svg" alt="Logo" className="w-8 h-8" />
          <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            Bilibili 无限历史记录
          </span>
        </div>

        {/* 右上角 - 用户信息和退出登录 */}
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="text-gray-700 font-medium">
                {user.name || "用户"}
              </span>
            </div>
          )}

          <Button
            onClick={handleSignOut}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 px-4 py-1.5"
          >
            退出登录
          </Button>
        </div>
      </div>
    </nav>
  );
}
