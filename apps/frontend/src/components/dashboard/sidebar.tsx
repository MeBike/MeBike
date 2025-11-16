"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bike,
  FileText,
  Users,
  LogOut,
  Wallet,
  Truck,
  Download,
  MapIcon,
  FileCheck2,
  Star,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-providers";
import { getRefreshToken } from "@/utils/tokenManager";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// Define menu items (giữ nguyên hàm này theo code bạn)
const getMenuItems = (userRole: "STAFF" | "ADMIN" | "USER" | "SOS") => {
  const baseUrl =
    userRole === "ADMIN"
      ? "/admin"
      : userRole === "STAFF"
        ? "/staff"
        : "/user";
  return [
    {
      title: "Tổng quan",
      icon: LayoutDashboard,
      href: baseUrl,
      roles: ["ADMIN"],
    },
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
    //   title: "Báo cáo & Thống kê",
    //   icon: BarChart3,
    //   href: "/admin/reports",
    //   roles: ["ADMIN"],
    // },
    // {
    //   title: "Cài đặt",
    //   icon: Settings,
    //   href: "/admin/settings",
    //   roles: ["ADMIN"],
    // },
    {
      title: "Tổng quan người dùng",
      icon: Users,
      href: "/user",
      roles: ["USER"],
    },
    {
      title: "Hồ sơ cá nhân",
      icon: Users,
      href: "/user/profile",
      roles: ["USER"],
    },
    // {
    //   title: "Lịch sử giao dịch",
    //   icon: History,
    //   href: "/user/booking-history",
    //   roles: ["USER"],
    // },
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
      title: "Rút tiền",
      icon: Download,
      href: "/admin/withdrawals",
      roles: ["ADMIN"],
    },
    {
      title: "Quản lý đặt trước",
      icon: FileText,
      href: "/admin/reservations",
      roles: ["ADMIN"],
    },
    {
      title: "Quản lý đơn báo cáo",
      icon: FileCheck2,
      href: "/admin/reports",
      roles: ["ADMIN"],
    },
    {
      title: "Quản lý đánh giá",
      icon: Star,
      href: "/admin/ratings",
      roles: ["ADMIN"],
    },
    {
      title: "Quản lý đơn SOS",
      icon: FileCheck2,
      href: "/staff/sos",
      roles: ["STAFF"],
    },
    {
      title: "Quản lý đơn SOS",
      icon: FileCheck2,
      href: "/sos/sos-alerts",
      roles: ["SOS"],
    },
    {
      title: "Hồ sơ cá nhân",
      icon: Users,
      href: "/sos/profile",
      roles: ["SOS"],
    },
    {
      title: "Hồ sơ cá nhân",
      icon: Users,
      href: "/staff/profile",
      roles: ["STAFF"],
    },
    {
      title: "Quản lý đơn báo cáo",
      icon: FileCheck2,
      href: "/staff/reports",
      roles: ["STAFF"],
    },
  ];
};

export function Sidebar() {
  const [collapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logOut, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      logOut(refreshToken);
      console.log(user?.email + " đã đăng xuất " + isAuthenticated);
    }
  };

  const menuItems = getMenuItems(user?.role as "STAFF" | "ADMIN" | "USER");
  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role as "STAFF" | "ADMIN" | "USER")
  );

  // Navigation handler with progress
  const handleNav = (href: string) => {
    if (pathname === href) return;
    NProgress.start();
    startTransition(() => {
      router.push(href);
      setMobileOpen(false);
      setTimeout(() => NProgress.done(), 600);
    });
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-sidebar border border-sidebar-border rounded-lg text-sidebar-foreground hover:bg-sidebar-accent"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
          "w-64 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{ opacity: isPending ? 0.65 : 1, transition: "opacity .2s" }}
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
                  <button
                    type="button"
                    onClick={() => handleNav(item.href)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-colors group",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    disabled={isPending || isActive}
                    style={{ cursor: isPending ? "wait" : "pointer" }}
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
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-2">
          {/* <button
            type="button"
            onClick={() =>
              handleNav(
                `${user?.role === "ADMIN" ? "/admin" : user?.role === "USER" ? "/user" : user?.role === "SOS" ? "/sos" : "/staff"}/profile`
              )
            }
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            disabled={isPending}
          >
            <User className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Hồ sơ</span>}
          </button> */}
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-red-600 hover:text-white transition-colors cursor-pointer hover:opacity-90"
            onClick={() => handleLogout()}
            disabled={isPending}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">Đăng xuất</span>
            )}
          </button>
        </div>
      </div>
      </aside>
    </>
  );
}
