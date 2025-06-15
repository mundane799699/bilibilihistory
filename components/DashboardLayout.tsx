"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarCollapseChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* 左侧固定侧边栏 */}
      <Sidebar
        className="fixed left-0 top-16 bottom-0 z-40"
        onCollapseChange={handleSidebarCollapseChange}
      />

      {/* 右侧内容区域 */}
      <div
        className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
