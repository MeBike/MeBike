"use client";
import type React from "react";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import type { DetailUser } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { NotificationBell } from "../notifications/notification-bell";
interface DashboardLayoutProps {
  children: React.ReactNode;
  user: DetailUser;
}
export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}
      >
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex-1 max-w-md"></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pl-4 border-l border-border">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-foreground">
                    {user?.fullName || "Chưa có tên"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.role || "user"}
                  </p>
                </div>
                <NotificationBell userId={user?.id} userRole={user?.role} />
                <Avatar className="w-10 h-10 border-2 border-primary/20">
                  <AvatarImage
                    src={user.avatar || "/placeholder.svg"}
                    alt={user?.fullName || "User"}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                    {user?.fullName || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
