"use client";

import { useAuth } from "@/providers/auth-providers";
import { clearTokens } from "@/utils/tokenManager";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
interface StaffLayoutProps {
  children: React.ReactNode;
}

export default function StaffLayout({ children }: StaffLayoutProps) {
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
      } else if (user && user.role !== "STAFF") {
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
    queryClient,
    isAuthenticated,
    user,
    isLoggingOut,
    router,
    hasAlreadyRedirected,
  ]);

  useEffect(() => {
    console.log("user:", user, "isAuthenticated:", isAuthenticated);
  }, [user, isAuthenticated]);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Đang kiểm tra quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  // Nếu không hợp lệ, hiển thị trang trắng hoặc Loading sẽ redirect
  if (showUnauthorized) {
<<<<<<< Updated upstream
    return null;
=======
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300">
            {/* Header với gradient */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 h-2"></div>
            <div className="p-8 text-center">
              <div className="mb-8 relative">
                <div className="absolute inset-0 bg-red-100 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                <Image
                  src="/401-status-code.png"
                  alt="Unauthorized access - 401 status code"
                  width={300}
                  height={300}
                  className="relative z-10 mx-auto rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                  priority
                />
              </div>
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    🚫 Truy cập bị từ chối
                  </h2>
                  <div className="w-20 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full"></div>
                </div>

                <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
                  Bạn không có quyền truy cập vào trang này. Chỉ 
                  <span className="font-semibold text-orange-600"> nhân viên (Staff) </span>
                  mới có thể truy cập khu vực này.
                </p>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-200"></div>
                      <div className="animate-spin rounded-full h-8 w-8 border-3 border-t-blue-600 absolute top-0 left-0"></div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-700 font-semibold text-lg">
                        🔄 Đang chuyển hướng...
                      </div>
                      <div className="text-blue-600 text-sm">
                        Sẽ chuyển về trang đăng nhập trong vài giây
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-yellow-800 text-sm">
                    💡 <strong>Gợi ý:</strong> Hãy đăng nhập bằng tài khoản Staff để truy cập trang này.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
>>>>>>> Stashed changes
  }

  return (
    <div>
      <main>
        <div>
          {user && <DashboardLayout user={user}>{children}</DashboardLayout>}
        </div>
      </main>
    </div>
  );
}
