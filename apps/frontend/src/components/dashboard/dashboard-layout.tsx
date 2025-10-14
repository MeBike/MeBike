

import type React from "react";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DetailUser } from "@/services/authService";
import Image from "next/image";
interface DashboardLayoutProps {
  children: React.ReactNode;
  user: DetailUser;
}
export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarCollapsed,] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={user?.role} />
      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}
      >
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm xe, khách hàng, đơn thuê..."
                  className="pl-9 bg-muted/50"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
              <div className="flex items-center gap-3 pl-4 border-l border-border">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-foreground">
                    {user.fullname}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.role}
                  </p>
                </div>
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted">
                  <Image
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.fullname}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
