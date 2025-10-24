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
  User,
  LogOut,
  History,
  Wallet,
  Truck,
  Download,
  RotateCcw,
  MapIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-providers";
import { getRefreshToken } from "@/utils/tokenManager";

const getMenuItems = (userRole: "STAFF" | "ADMIN" | "USER") => {
  const baseUrl =
    userRole === "ADMIN"
      ? "/admin"
      : userRole === "STAFF"
      ? "/staff"
      : "/customer";
  
  return [
    {
      title: "Tổng quan",
      icon: LayoutDashboard,
      href: baseUrl,
      roles: ["STAFF", "ADMIN"],
    },
    // {
    //   title: "Đơn thuê xe",
    //   icon: FileText,
    //   href: `${baseUrl}/rentals`,
    //   roles: ["STAFF", "ADMIN"],
    // },
    {
      title: "Quản lý người dùng",
      icon: Users,
      href: `${baseUrl}/customers`,
      roles: ["STAFF", "ADMIN"],
    },
    {
      title: "Quản lý xe đạp",
      icon: Bike,
      href: `${baseUrl}/bikes`,
      roles: ["STAFF", "ADMIN"],
    },
    {
      title: "Đơn thuê xe",
      icon: FileText,
      href: `${baseUrl}/rentals`,
      roles: ["STAFF", "ADMIN"],
    },
    // {
    //   title: "Khách hàng",
    //   icon: Users,
    //   href: `${baseUrl}/customers`,
    //   roles: ["STAFF", "ADMIN"],
    // },
    {
      title: "Báo cáo & Thống kê",
      icon: BarChart3,
      href: "/admin/reports",
      roles: ["ADMIN"],
    },
    {
      title: "Cài đặt",
      icon: Settings,
      href: "/admin/settings",
      roles: ["ADMIN"],
    },
    {
      title: "Hồ sơ cá nhân",
      icon: Users,
      href: "/user/profile",
      roles: ["USER"],
    },
    {
      title: "Lịch sử giao dịch",
      icon: History,
      href: "/user/booking-history",
      roles: ["USER"],
    },
    {
      title: "Quản lý ví",
      icon: Wallet,
      href: "/admin/wallet",
      roles: ["ADMIN"],
    },
    {
      title: "Quản lý nhà cung cấp",
      icon: Truck,
      href: "/admin/suppliers",
      roles: ["ADMIN"],
    },
    {
      title: "Quản lý trạm",
      icon: MapIcon,
      href: "/staff/stations",
      roles: ["STAFF"],
    },
    {
      title: "Quản lý trạm",
      icon: MapIcon,
      href: "/admin/stations",
      roles: ["ADMIN"],
    },
    {
      title: "Hoàn tiền",
      icon: RotateCcw,
      href: "/admin/refunds",
      roles: ["ADMIN"],
    },
    {
      title: "Rút tiền",
      icon: Download,
      href: "/admin/withdrawals",
      roles: ["admin"],
    },
  ];
};

export function Sidebar() {
  const [collapsed] = useState(false);
  const {user,logOut , isAuthenticated} = useAuth();
  const pathname = usePathname();
  const handleLogout = () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      logOut(refreshToken);
      console.log(user?.email + " đã đăng xuất" + isAuthenticated);
    }
  }
  const menuItems = getMenuItems(user?.role as "STAFF" | "ADMIN" | "USER");
  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role as "STAFF" | "ADMIN" | "USER")
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
        </div>

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

        <div className="border-t border-sidebar-border p-2">
          <Link
            href={`${user?.role === "ADMIN" ? "/admin" : "/staff"}/profile`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <User className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Hồ sơ</span>}
          </Link>
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors
          cursor-pointer"
            onClick={() => handleLogout()}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium ">Đăng xuất</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
