"use client";

import { useState, useTransition, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bike,
  Users,
  LogOut,
  MapIcon,
  Star,
  Menu,
  X,
  User2,
  Building2,
  CalendarCheck2,
  Store,
  Timer,
  ChevronDown,
  Settings2,
  Activity,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-providers";
import { getRefreshToken } from "@/utils/tokenManager";
import NProgress from "nprogress";

// Bảng màu hiện đại, bỏ hoàn toàn các tone màu nóng/gắt
const ROLE_CONFIG = {
 ADMIN: {
    label: "Quản trị hệ thống",
    bg: "bg-slate-950",
    accent: "bg-blue-500",
    text: "text-blue-300",
    hover: "hover:bg-blue-500/10",
    active: "bg-blue-600 text-white shadow-lg shadow-blue-500/20",
  },
  STAFF: {
    label: "Nhân viên vận hành",
    bg: "bg-slate-900",
    accent: "bg-sky-500",
    text: "text-sky-300",
    hover: "hover:bg-sky-500/10",
    active: "bg-sky-600 text-white shadow-lg shadow-sky-500/20",
  },
  AGENCY: {
    label: "Đại lý đối tác",
    bg: "bg-zinc-950",
    accent: "bg-emerald-500",
    text: "text-emerald-300",
    hover: "hover:bg-emerald-500/10",
    active: "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
  },
  TECHNICIAN: {
    label: "Kỹ thuật viên",
    bg: "bg-gray-950",
    accent: "bg-cyan-500",
    text: "text-cyan-300",
    hover: "hover:bg-cyan-500/10",
    active: "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20",
  },
  MANAGER: {
    label: "Quản lý khu vực",
    bg: "bg-slate-950",
    accent: "bg-violet-500",
    text: "text-violet-300",
    hover: "hover:bg-violet-500/10",
    active: "bg-violet-600 text-white shadow-lg shadow-violet-500/20",
  },
  USER: {
    label: "Khách hàng",
    bg: "bg-slate-900",
    accent: "bg-slate-400",
    text: "text-slate-300",
    hover: "hover:bg-white/5",
    active: "bg-white text-slate-900",
  },
  SOS: {
    label: "Đội cứu hộ",
    bg: "bg-slate-950",
    accent: "bg-blue-500",
    text: "text-blue-300",
    hover: "hover:bg-blue-500/10",
    active: "bg-blue-600 text-white",
  },
};

type RoleType = keyof typeof ROLE_CONFIG;

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    "Người dùng": true, // Mặc định mở nhóm đầu tiên cho thân thiện
  });

  const { user, logOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const role = (user?.role as RoleType) || "USER";
  const theme = ROLE_CONFIG[role];

  const toggleDropdown = (title: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const menuGroups = useMemo(() => {
    const rawGroups = [
      {
        title: "Tổng quan",
        icon: LayoutDashboard,
        href: `/${role.toLowerCase()}`,
        roles: ["ADMIN", "STAFF", "AGENCY", "MANAGER", "USER", "TECHNICIAN"],
        exact: true,
      },
      {
        title: "Quản lý nhân sự",
        icon: Users,
        roles: ["ADMIN"],
        children: [
          { title: "Khách hàng", href: `/${role.toLowerCase()}/customers` },
          { title: "Nhân viên", href: `/${role.toLowerCase()}/staffs` },
          { title: "Đội kỹ thuật", href: `/${role.toLowerCase()}/technician-teams` },
          { title: "Yêu cầu Agency", href: `/${role.toLowerCase()}/agency-request` },
        ],
      },
      {
        title: "Hoạt động vận hành",
        icon: Activity,
        roles: ["ADMIN", "STAFF", "MANAGER", "AGENCY"],
        children: [
          { title: "Đơn đặt trước", href: `/${role.toLowerCase()}/reservations` },
          { title: "Phiên thuê xe", href: `/${role.toLowerCase()}/rentals` },
          { title: "Điều phối xe", href: `/${role.toLowerCase()}/distribution-request` },
        ],
      },
      {
        title: "Hạ tầng thiết bị",
        icon: MapPin,
        roles: ["ADMIN", "STAFF", "MANAGER", "AGENCY", "TECHNICIAN"],
        children: [
          { title: "Danh sách xe", href: `/${role.toLowerCase()}/bikes` },
          { title: "Quản lý trạm", href: `/${role.toLowerCase()}/stations` },
        ],
      },
      {
        title: "Hệ thống & Đối tác",
        icon: Settings2,
        roles: ["ADMIN"],
        children: [
          { title: "Quản lý Agency", href: "/admin/agencies" },
          { title: "Mã giảm giá", href: "/admin/coupon" },
          { title: "Nhà cung cấp", href: "/admin/suppliers" },
          { title: "Gói Subscription", href: `/${role.toLowerCase()}/subscription` },
        ],
      },
      {
        title: "Môi trường & CSKH",
        icon: ShieldCheck,
        roles: ["ADMIN"],
        children: [
          { title: "Chính sách CO2", href: "/admin/environment-policy" },
          { title: "Tác động CO2", href: "/admin/environment-impact" },
          { title: "Đánh giá & Phản hồi", href: `/${role.toLowerCase()}/ratings` },
        ],
      },
      {
        title: "Tiện ích khách",
        icon: Bike,
        roles: ["USER"],
        children: [
          { title: "Đăng ký làm Agency", href: "/user/my-agency-request" },
        ],
      },
      {
        title: "Hồ sơ cá nhân",
        icon: User2,
        href: `/${role.toLowerCase()}/profile`,
        roles: ["ADMIN", "STAFF", "AGENCY", "TECHNICIAN", "USER", "SOS", "MANAGER"],
      },
    ];

    return rawGroups.filter((group) => group.roles.includes(role));
  }, [role]);

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
      <button
        className={cn(
          "fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg text-white shadow-lg",
          theme.accent,
        )}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transition-all duration-300 w-64 border-r border-white/5 text-white flex flex-col",
          theme.bg,
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Header Logo */}
        <div className="p-6 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl text-white", theme.accent)}>
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight">MeBike System</h2>
              <p className={cn("text-[10px] font-medium opacity-80 uppercase tracking-widest", theme.text)}>
                {theme.label}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
          {menuGroups.map((group) => {
            const isDropdown = !!group.children;
            const isOpen = openDropdowns[group.title];
            
            // Check if any child is active
            const hasActiveChild = group.children?.some(child => pathname === child.href);
            const isSingleActive = group.href && (group.exact ? pathname === group.href : pathname.startsWith(group.href));

            return (
              <div key={group.title} className="flex flex-col space-y-1">
                <button
                  onClick={() => isDropdown ? toggleDropdown(group.title) : group.href && handleNav(group.href)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                    isSingleActive ? theme.active : "text-white/50 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <group.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isSingleActive || hasActiveChild ? "text-white" : "text-white/40")} />
                    <span className="text-sm font-medium">{group.title}</span>
                  </div>
                  {isDropdown && (
                    <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180", hasActiveChild ? "text-white" : "text-white/30")} />
                  )}
                </button>

                {isDropdown && (
                  <div className={cn("flex flex-col space-y-1 overflow-hidden transition-all duration-300 pl-10", isOpen ? "max-h-96 py-1" : "max-h-0")}>
                    {group.children?.map((child) => {
                      const isActive = pathname === child.href;
                      return (
                        <button
                          key={child.href}
                          onClick={() => handleNav(child.href)}
                          className={cn(
                            "w-full flex items-center py-2.5 px-3 rounded-lg text-[13px] transition-all relative group",
                            isActive ? cn("text-white font-bold", theme.active) : "text-white/40 hover:text-white hover:bg-white/5"
                          )}
                        >
                          {child.title}
                          {isActive && <div className="absolute right-2 w-1 h-1 rounded-full bg-white shadow-md" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 bg-black/20 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-white/10">
              <User2 size={16} className="text-white/60" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[11px] font-bold truncate">{user?.email || "Admin"}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-tighter">Session: {role}</p>
            </div>
          </div>

          <button
            onClick={() => {
              const token = getRefreshToken();
              if (token) logOut(token);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-all text-xs font-bold"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}
    </>
  );
}