"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Clock,
  Heart,
  User,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react";

interface SidebarProps {
  className?: string;
  onCollapseChange?: (collapsed: boolean) => void;
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
  {
    openInNewTab: true,
    name: "会员定价",
    href: "/pricing",
    icon: DollarSign,
  },
];

export default function Sidebar({ className, onCollapseChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
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
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  useEffect(() => {
    onCollapseChange?.(collapsed);
  }, []);

  return (
    <div
      className={`${className} ${
        collapsed ? "w-16" : "w-40"
      } bg-white shadow-sm border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col`}
    >
      {/* 菜单项 */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item)}
              className={`w-full flex items-center ${
                collapsed ? "justify-center" : "justify-start"
              } px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-pink-50 to-blue-50 text-pink-600 border border-pink-200"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="ml-3 text-left">{item.name}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 折叠按钮 - 移动到底部 */}
      <button
        onClick={handleToggleCollapse}
        className="w-full flex items-center justify-center p-4 rounded-lg hover:bg-gray-100 text-gray-600"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
