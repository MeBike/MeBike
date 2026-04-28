"use client";

import { useState, useTransition, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bike,
  FileText,
  Users,
  LogOut,
  Truck,
  MapIcon,
  Star,
  FileCheck2,
  Menu,
  X,
  User2,
  Building2,
  ShieldAlert,
  CalendarCheck2,
  Store,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-providers";
import { getRefreshToken } from "@/utils/tokenManager";
import NProgress from "nprogress";

const ROLE_CONFIG = {
  ADMIN: {
    label: "Quản trị hệ thống",
    bg: "bg-zinc-950", // Chuyển sang zinc-950 để có màu đen tuyền sang trọng hơn
    accent: "bg-red-500",
    text: "text-red-500",
    hover: "hover:bg-red-500/15",
    // Thêm gradient và shadow nhẹ để nút active bớt "gắt" và đẹp hơn
    active:
      "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-500/20",
  },
  STAFF: {
    label: "Nhân viên vận hành",
    bg: "bg-blue-950",
    accent: "bg-blue-600",
    text: "text-blue-400",
    hover: "hover:bg-blue-600/10",
    active: "bg-blue-600 text-white",
  },
  AGENCY: {
    label: "Đại lý đối tác",
    bg: "bg-indigo-950",
    accent: "bg-indigo-600",
    text: "text-indigo-400",
    hover: "hover:bg-indigo-600/10",
    active: "bg-indigo-600 text-white",
  },
  TECHNICIAN: {
    label: "Kỹ thuật viên",
    bg: "bg-emerald-950",
    accent: "bg-emerald-600",
    text: "text-emerald-400",
    hover: "hover:bg-emerald-600/10",
    active: "bg-emerald-600 text-white",
  },
  MANAGER: {
    label: "Quản lý khu vực",
    bg: "bg-orange-950",
    accent: "bg-orange-600",
    text: "text-orange-400",
    hover: "hover:bg-orange-600/10",
    active: "bg-orange-600 text-white",
  },
  USER: {
    label: "Khách hàng",
    bg: "bg-zinc-900",
    accent: "bg-zinc-700",
    text: "text-zinc-400",
    hover: "hover:bg-white/10",
    active: "bg-white text-black",
  },
  SOS: {
    label: "Đội cứu hộ",
    bg: "bg-rose-950",
    accent: "bg-rose-600",
    text: "text-rose-400",
    hover: "hover:bg-rose-600/10",
    active: "bg-rose-600 text-white",
  },
};

type RoleType = keyof typeof ROLE_CONFIG;

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const role = (user?.role as RoleType) || "USER";
  const theme = ROLE_CONFIG[role];

  const menuItems = useMemo(
    () =>
      [
        {
          title: "Tổng quan",
          icon: LayoutDashboard,
          href: `/${role.toLowerCase()}`,
          roles: ["ADMIN", "STAFF", "AGENCY", "MANAGER", "USER","TECHNICIAN"],
          exact: true,
        },
        {
          title: "Quản lý khách hàng",
          icon: Users,
          href: `/${role.toLowerCase()}/customers`,
          roles: ["ADMIN"]
        },
        {
          title: "Quản lý nhân viên",
          icon: Users,
          href: `/${role.toLowerCase()}/staffs`,
          roles: ["ADMIN"],
        },
        {
          title: "Quản lý đội kỹ thuật",
          icon: Users,
          href: `/${role.toLowerCase()}/technician-teams`,
          roles: ["ADMIN"],
        },
        {
          title: "Quản lý điều phối xe",
          icon: Users,
          href: `/${role.toLowerCase()}/distribution-request`,
          roles: ["ADMIN", "MANAGER","STAFF","AGENCY"],
        },
        {
          title: "Quản lý Agency",
          icon: Building2,
          href: "/admin/agencies",
          roles: ["ADMIN"],
        },
        {
          title: "Quản lý coupon",
          icon: Building2,
          href: "/admin/coupon",
          roles: ["ADMIN"],
        },
        {
          title: "Quản lý nhà cung cấp",
          icon: Store,
          href: "/admin/suppliers",
          roles: ["ADMIN"],
        },
        {
          title: "Quản lý chính sách CO2",
          icon: Store,
          href: "/admin/environment-policy",
          roles: ["ADMIN"],
        },
        {
          title: "Lịch sử tác động CO2",
          icon: Store,
          href: "/admin/environment-impact",
          roles: ["ADMIN"],
        },
        {
          title: "Quản lý đơn đặt trước",
          icon: CalendarCheck2,
          href: `/${role.toLowerCase()}/reservations`,
          roles: ["ADMIN", "STAFF","MANAGER","AGENCY"],
        },
        {
          title: "Quản lý phiên thuê",
          icon: Timer,
          href: `/${role.toLowerCase()}/rentals`,
          roles: ["STAFF", "ADMIN", "MANAGER","AGENCY"],
        },
        {
          title: "Quản lý xe đạp",
          icon: Bike,
          href: `/${role.toLowerCase()}/bikes`,
          roles: ["STAFF", "ADMIN", "AGENCY", "MANAGER","TECHNICIAN"],
        },
        {
          title: "Quản lý trạm",
          icon: MapIcon,
          href: `/${role.toLowerCase()}/stations`,
          roles: ["STAFF", "ADMIN", "MANAGER","AGENCY","TECHNICIAN"],
        },
        {
          title: "Đánh giá & Phản hồi",
          icon: Star,
          href: `/${role.toLowerCase()}/ratings`,
          roles: ["ADMIN"],
        },
        {
          title: "Quản lý subscription",
          icon: Star,
          href: `/${role.toLowerCase()}/subscription`,
          roles: ["ADMIN"],
        },
        {
          title: "Chuyến đi của tôi",
          icon: Bike,
          href: "/user/trips",
          roles: ["USER"],
        },
        {
          title: "Đăng ký Agency",
          icon: Bike,
          href: "/user/my-agency-request",
          roles: ["USER"],
        },
        {
          title: "Yêu cầu trở thành Agency",
          icon: User2,
          href: `/${role.toLowerCase()}/agency-request`,
          roles: ["ADMIN"],
        },
        {
          title: "Hồ sơ cá nhân",
          icon: User2,
          href: `/${role.toLowerCase()}/profile`,
          roles: ["ADMIN", "STAFF", "AGENCY", "TECHNICIAN", "USER", "SOS" , "MANAGER"],
        },
      ].filter((item) => item.roles.includes(role)),
    [role],
  );

  const handleNav = (href: string) => {
    if (pathname === href) return;
    NProgress.start();
    startTransition(() => {
      router.push(href);
      setMobileOpen(false);
      setTimeout(() => NProgress.done(), 500);
    });
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className={cn(
          "fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg text-white shadow-lg transition-transform active:scale-95",
          theme.accent,
        )}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Content */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transition-all duration-300 w-64 border-r border-white/10 text-white shadow-2xl flex flex-col",
          theme.bg,
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="p-6 border-b border-white/10 bg-black/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-xl shadow-lg ring-2 ring-white/10",
                theme.accent,
              )}
            >
              <Bike className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight tracking-tight">
                MeBike
              </h2>
              <span
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider bg-white/10",
                  theme.text,
                )}
              >
                {theme.label}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links - Đã fix scrollbar cực mượt */}
        <nav
          className="flex-1 overflow-y-auto py-6 px-3 space-y-1 
          [&::-webkit-scrollbar]:w-1.5 
          [&::-webkit-scrollbar-track]:bg-transparent 
          [&::-webkit-scrollbar-thumb]:bg-white/10 
          [&::-webkit-scrollbar-thumb]:rounded-full 
          hover:[&::-webkit-scrollbar-thumb]:bg-white/20 
          transition-colors"
        >
          {menuItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                disabled={isPending}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? cn("font-bold", theme.active)
                    : cn("text-white/50 hover:text-white", theme.hover),
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-all group-hover:rotate-6 shrink-0",
                    isActive
                      ? "text-white"
                      : "text-white/40 group-hover:text-white",
                  )}
                />
                <span className="text-sm truncate text-left">{item.title}</span>
                {isActive && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer/Logout - Dùng shrink-0 để không bị cuộn theo menu */}
        <div className="p-4 bg-black/40 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/20 shrink-0">
              <User2 size={20} className="text-white/60" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">
                {user?.email || "Người dùng"}
              </p>
              <p className="text-[10px] text-white/30 font-medium tracking-tight truncate">
                Phiên làm việc: {role}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const token = getRefreshToken();
              if (token) logOut(token);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-600 hover:text-white transition-all font-bold border border-red-500/20 group"
          >
            <LogOut
              size={18}
              className="group-hover:-translate-x-1 transition-transform shrink-0"
            />
            <span className="text-sm">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
