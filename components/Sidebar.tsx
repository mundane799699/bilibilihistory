"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Clock,
  Heart,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  className?: string;
  onCollapseChange?: (collapsed: boolean) => void;
  collapsed?: boolean;
  /** 移动端抽屉是否展开 */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuItems = [
  {
    openInNewTab: false,
    name: "历史记录",
    href: "/dashboard",
    icon: Clock,
  },
  {
    openInNewTab: false,
    name: "收藏",
    href: "/dashboard/favorites",
    icon: Heart,
  },
  {
    openInNewTab: false,
    name: "个人中心",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    openInNewTab: false,
    name: "设置",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar({
  className,
  onCollapseChange,
  collapsed,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (item: { href: string; openInNewTab: boolean }) => {
    if (item.openInNewTab) {
      window.open(item.href, "_blank");
    } else {
      router.push(item.href);
    }
  };

  const handleToggleCollapse = () => {
    onCollapseChange?.(!collapsed);
  };

  return (
    <aside
      className={`${className} flex w-[232px] flex-col border-r border-border/60 bg-white transition-transform duration-300 ease-in-out md:transition-[width] ${
        collapsed ? "md:w-16" : "md:w-[200px]"
      } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
    >
      <nav className="flex-1 px-3 py-4">
        <p
          className={`mb-2 hidden px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 md:block ${
            collapsed ? "md:hidden" : ""
          }`}
        >
          菜单
        </p>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item)}
                title={collapsed ? item.name : undefined}
                className={`flex w-full items-center justify-start rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                  collapsed ? "md:justify-center" : ""
                } ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                <span
                  className={`ml-2.5 overflow-hidden whitespace-nowrap text-left transition-all duration-300 ease-in-out ${
                    collapsed ? "md:ml-0 md:max-w-0" : "md:max-w-[120px]"
                  }`}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {!collapsed && (
        <div className="mx-3 mb-3 hidden rounded-xl border border-border/60 bg-muted/30 p-3 md:block">
          <div className="flex items-center gap-1.5 text-[12px] font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            升级会员
          </div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
            多设备同步、无限上传
          </p>
          <button
            onClick={() => router.push("/pricing")}
            className="mt-2.5 inline-flex h-7 w-full items-center justify-center rounded-lg bg-primary text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            查看方案
          </button>
        </div>
      )}

      <button
        onClick={handleToggleCollapse}
        className="hidden w-full items-center justify-center border-t border-border/60 p-3 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground md:flex"
        aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}