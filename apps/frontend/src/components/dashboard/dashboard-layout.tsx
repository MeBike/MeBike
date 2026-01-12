
"use client";
import type React from "react";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Me } from "@/types/GraphQL";
import Image from "next/image";
import { cn } from "@/lib/utils";
interface DashboardLayoutProps {
  children: React.ReactNode;
  user: Me;
}
export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarCollapsed,] = useState(false);
  
  const getRoleStyles = (role: string) => {
    switch (role) {
      case "SOS":
        return "bg-slate-950 text-slate-50";
      case "STAFF":
        return "bg-slate-50 text-slate-900";
      case "USER":
        return "bg-white text-slate-900";
      default:
        return "bg-background text-foreground";
    }
  };

  const getHeaderStyles = (role: string) => {
    switch (role) {
      case "SOS":
        return "bg-slate-900/95 border-red-900/50 text-red-50";
      case "STAFF":
        return "bg-white/95 border-indigo-100 text-indigo-950";
      case "USER":
        return "bg-emerald-50/95 border-emerald-100 text-emerald-950";
      default:
        return "bg-card/95 border-border";
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${getRoleStyles(user?.role)}`}>
      <Sidebar />
      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}
      >
        <header className={`sticky top-0 z-30 border-b backdrop-blur-md supports-backdrop-filter:bg-opacity-60 transition-all duration-300 ${getHeaderStyles(user?.role)}`}>
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-sm shadow-sm ${
                  user?.role === "SOS" ? "bg-red-600 text-white animate-pulse" : 
                  user?.role === "STAFF" ? "bg-indigo-600 text-white" : 
                  "bg-emerald-600 text-white"
                }`}>
                  {user?.role} System
                </span>
                {user?.role === "SOS" && (
                  <div className="flex items-center gap-2 text-red-500">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-widest">Live Monitoring</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 pl-6 border-l border-current/10">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black tracking-tight leading-none mb-1">
                    {user?.name || "Chưa có tên"}
                  </p>
                  <p className="text-[10px] opacity-60 uppercase font-bold tracking-tighter">
                    {user?.email}
                  </p>
                </div>
                <div className={`relative w-10 h-10 rounded-full overflow-hidden border-2 p-0.5 transition-transform hover:scale-110 cursor-pointer ${
                  user?.role === "SOS" ? "border-red-500 bg-red-500/10" : 
                  user?.role === "STAFF" ? "border-indigo-500 bg-indigo-500/10" : 
                  "border-emerald-500 bg-emerald-500/10"
                }`}>
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image
                      src={user?.avatarUrl || "/placeholder.svg"}
                      alt={user?.name || "User"}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className={cn(
          "p-8 min-h-[calc(100-4rem)]",
          user?.role === "USER" ? "max-w-7xl mx-auto" : ""
        )}>
          <div className={cn(
            "rounded-2xl transition-all duration-500",
            user?.role === "SOS" ? "bg-slate-900/50 border border-red-900/20 shadow-2xl shadow-red-900/10 p-6" : 
            user?.role === "STAFF" ? "bg-white shadow-xl shadow-slate-200/50 p-8 border border-slate-100" : 
            "bg-white shadow-2xl shadow-emerald-900/5 p-10 border border-emerald-50"
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
