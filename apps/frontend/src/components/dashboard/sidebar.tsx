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
  User2,
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
      title: "Hồ sơ cá nhân",
      icon: User2,
      href: "/staff/profile",
      roles: ["STAFF"],
    },
    {
      title: "Hồ sơ cá nhân",
      icon: User2,
      href: "/admin/profile",
      roles: ["ADMIN"],
    },
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
      title: "Quản lý đơn báo cáo",
      icon: FileCheck2,
      href: "/staff/reports",
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
  ];
};

export function Sidebar() {
  const [collapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logOut, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending,] = useTransition();

  const handleLogout = () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      logOut();
      console.log(user?.email + " đã đăng xuất " + isAuthenticated);
    }
  };

  const menuItems = getMenuItems(user?.role as "STAFF" | "ADMIN" | "USER" | "SOS");
  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role as "STAFF" | "ADMIN" | "USER" | "SOS")
  );

  const getSidebarStyles = (role: string) => {
    switch (role) {
      case "SOS":
        return "bg-slate-950 border-red-900/30 text-slate-200";
      case "STAFF":
        return "bg-slate-900 border-indigo-900/30 text-indigo-50";
      case "USER":
        return "bg-emerald-950 border-emerald-900/30 text-emerald-50";
      case "ADMIN":
        return "bg-sidebar border-sidebar-border text-sidebar-foreground";
      default:
        return "bg-sidebar border-sidebar-border text-sidebar-foreground";
    }
  };

  const getActiveStyles = (role: string) => {
    switch (role) {
      case "SOS":
        return "bg-red-600 text-white";
      case "STAFF":
        return "bg-indigo-600 text-white";
      case "USER":
        return "bg-emerald-600 text-white";
      case "ADMIN":
        return "bg-sidebar-primary text-sidebar-primary-foreground";
      default:
        return "bg-sidebar-primary text-sidebar-primary-foreground";
    }
  };

  const getHoverStyles = (role: string) => {
    switch (role) {
      case "SOS":
        return "hover:bg-red-900/40 hover:text-red-200";
      case "STAFF":
        return "hover:bg-indigo-900/40 hover:text-indigo-200";
      case "USER":
        return "hover:bg-emerald-900/40 hover:text-emerald-200";
      default:
        return "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
    }
  };

  // Navigation handler with progress
  const handleNav = (href: string) => {
    if (pathname === href) return;

    NProgress.start();
    router.push(href);
    setMobileOpen(false);
    setTimeout(() => NProgress.done(), 600);
  };

  const sidebarBg = getSidebarStyles(user?.role || "");
  const activeStyle = getActiveStyles(user?.role || "");
  const hoverStyle = getHoverStyles(user?.role || "");

  return (
    <>
      <button
        className={cn(
          "fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg border transition-colors",
          user?.role === "SOS" ? "bg-red-950 border-red-900 text-red-500" : "bg-sidebar border-sidebar-border text-sidebar-foreground"
        )}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r transition-all duration-300",
          "w-64 md:translate-x-0",
          sidebarBg,
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{ opacity: isPending ? 0.65 : 1, transition: "opacity .2s" }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-lg shadow-lg",
                  user?.role === "SOS" ? "bg-red-600" : user?.role === "STAFF" ? "bg-indigo-600" : "bg-emerald-600"
                )}>
                  <Bike className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight">
                    MeBike
                  </h2>
                  <p className="text-[10px] opacity-60 uppercase font-semibold">
                    {user?.role || "user"} Dashboard
                  </p>
                </div>
              </div>
            )}
          </div>
          <nav className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-1.5 px-3">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => handleNav(item.href)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-all duration-200 group",
                        isActive
                          ? cn(activeStyle, "shadow-md scale-[1.02]")
                          : cn("text-inherit opacity-70", hoverStyle)
                      )}
                      disabled={isPending || isActive}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                          isActive ? "text-white" : ""
                        )}
                      />
                      {!collapsed && (
                        <span className="text-sm font-semibold">{item.title}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto border-t border-white/5 p-4">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white transition-all duration-200 cursor-pointer font-bold text-sm"
              onClick={() => handleLogout()}
              disabled={isPending}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Đăng xuất</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
