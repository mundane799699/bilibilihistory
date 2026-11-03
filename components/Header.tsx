"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Menu } from "lucide-react";

interface HeaderProps {
  user: any;
  onMenuClick?: () => void;
}

export default function Header({ user, onMenuClick }: HeaderProps) {
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

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 w-full items-center justify-between px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-1">
          <button
            onClick={onMenuClick}
            className="-ml-1.5 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground md:hidden"
            aria-label="打开菜单"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <img
              src="/images/icon.svg"
              alt="Bilibili 无限历史记录"
              className="h-7 w-7 shrink-0 md:h-8 md:w-8"
            />
            <span className="truncate text-[14px] font-semibold tracking-tight md:text-[15px]">
              Bilibili 无限历史记录
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 rounded-full border border-border bg-white p-1 transition-colors hover:bg-muted/50 md:py-1 md:pl-1 md:pr-3"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
                {initial}
              </span>
              <span className="hidden max-w-[140px] truncate text-[13px] font-medium md:block">
                {user.name || "用户"}
              </span>
            </Link>
          )}

          <button
            onClick={handleSignOut}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground md:px-3"
            aria-label="退出登录"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">退出</span>
          </button>
        </div>
      </div>
    </header>
  );
}