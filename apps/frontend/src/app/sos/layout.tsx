"use client";

import { useAuth } from "@/providers/auth-providers";
import { clearTokens } from "@/utils/tokenManager";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
interface SOSLayoutProps {
  children: React.ReactNode;
}

export default function SOSLayout({ children }: SOSLayoutProps) {
  const { user, isAuthenticated, isLoading, isLoggingOut } = useAuth();
  const router = useRouter();
  const [showUnauthorized, setShowUnauthorized] = useState(false);
  const queryClient = useQueryClient();
  const [hasAlreadyRedirected, setHasAlreadyRedirected] = useState(false);

  useEffect(() => {
    if (
      !isLoading &&
      !isLoggingOut &&
      typeof isAuthenticated !== "undefined" &&
      typeof user !== "undefined" &&
      !hasAlreadyRedirected
    ) {
      if (!isAuthenticated && !user) {
        router.push("/auth/login");
        setHasAlreadyRedirected(true);
      } else if (user && user.role !== "SOS") {
        setShowUnauthorized(true);
        toast.error("Bạn không có quyền truy cập!");
        clearTokens();
        queryClient.removeQueries({ queryKey: ["user", "me"] });
        router.push("/auth/login");
        setHasAlreadyRedirected(true);
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    isLoggingOut,
    router,
    hasAlreadyRedirected,
    queryClient,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-red-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Đang kiểm tra quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  if (showUnauthorized) {
    return null;
  }

  return (
    <div>
      <main>
        <div>
          <div>
            {user && <DashboardLayout user={user}>{children}</DashboardLayout>}
          </div>
        </div>
      </main>
    </div>
  );
}
