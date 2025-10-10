"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bike,
  FileText,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole: "STAFF" | "ADMIN" | "USER";
}

const menuItems = [
  {
    title: "Tổng quan",
    icon: LayoutDashboard,
    href: "/",
    roles: ["STAFF", "ADMIN"],
  },
  {
    title: "Quản lý xe đạp",
    icon: Bike,
    href: "/bikes",
    roles: ["STAFF", "ADMIN"],
  },
  {
    title: "Đơn thuê xe",
    icon: FileText,
    href: "/rentals",
    roles: ["STAFF", "ADMIN"],
  },
  {
    title: "Khách hàng",
    icon: Users,
    href: "/customers",
    roles: ["STAFF", "ADMIN"],
  },
  {
    title: "Báo cáo & Thống kê",
    icon: BarChart3,
    href: "/reports",
    roles: ["ADMIN"],
  },
  {
    title: "Cài đặt",
    icon: Settings,
    href: "/settings",
    roles: ["ADMIN"],
  },
];

export function Sidebar({ userRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-sidebar-primary rounded-lg">
                <Bike className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-sidebar-foreground">
                  BikeRental Pro
                </h2>
                <p className="text-xs text-muted-foreground">
                  Quản lý cho thuê
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-sidebar-accent rounded-md transition-colors"
            aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0",
                        isActive && "text-sidebar-primary-foreground"
                      )}
                    />
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.title}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-border p-2">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <User className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Hồ sơ</span>}
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">Đăng xuất</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
