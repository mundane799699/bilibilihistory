"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: any;
}

export default function DashboardLayout({
  children,
  user,
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // 切换路由后自动收起抽屉
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // 抽屉打开时锁住背景滚动
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 顶部条横贯全宽，压在左侧目录上方 */}
      <Header user={user} onMenuClick={() => setMobileOpen((v) => !v)} />

      <div className="flex flex-1">
        {/* 移动端遮罩 */}
        {mobileOpen && (
          <button
            aria-label="关闭菜单"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 top-16 z-40 bg-black/40 md:hidden"
          />
        )}

        {/* 侧边栏：从顶部条下方开始，桌面常驻、移动端抽屉 */}
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileOpen}
          onCollapseChange={setSidebarCollapsed}
          onMobileClose={() => setMobileOpen(false)}
          className="fixed bottom-0 left-0 top-16 z-50 md:z-30"
        />

        <div
          className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? "md:ml-16" : "md:ml-[200px]"
          }`}
        >
          <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-6 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}