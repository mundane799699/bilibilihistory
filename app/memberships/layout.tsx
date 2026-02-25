"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Users, KeyRound } from "lucide-react";

const menuItems = [
  {
    name: "会员管理",
    href: "/memberships",
    icon: Users,
  },
  {
    name: "密码管理",
    href: "/memberships/passwords",
    icon: KeyRound,
  },
];

export default function MembershipsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-white border-r border-gray-200 shadow-sm flex flex-col fixed top-0 left-0 h-screen overflow-y-auto">
        <div className="px-4 py-6">
          <h2 className="text-lg font-semibold text-gray-800">后台管理</h2>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive =
              item.href === "/memberships"
                ? pathname === "/memberships"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-pink-50 to-blue-50 text-pink-600 border border-pink-200"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="ml-3">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 bg-gray-50 overflow-auto ml-56">{children}</main>
    </div>
  );
}
