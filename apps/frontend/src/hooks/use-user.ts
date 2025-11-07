import { useQueryClient } from "@tanstack/react-query";
import { useGetAllUserQuery } from "./query/User/useGetAllUserQuery";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { VerifyStatus } from "@/types";
import { useGetAllStatisticsUserQuery } from "./query/User/useGetAllStatisticsQuery";
import { useGetActiveUserQuery } from "./query/User/useGetActiveUserQuery";
import { useGetNewRegistrationStatsQuery } from "./query/User/useGetNewRegistrationStatsQuery";
import { useGetTopRenterQuery } from "./query/User/useGetTopRenterQuery";
import { useGetSearchUserQuery } from "./query/Refund/useGetSearchUserQuery";
import { useCreateUserMutation } from "./mutations/User/useCreateUserMutation";
import { UserProfile } from "@/schemas/userSchema";
import { useGetDetailUserQuery } from "./query/User/useGetDetailUserQuery";
import { useGetDashboardStatsQuery } from "./query/User/useGetDashboardStatsQuery";
interface ErrorWithMessage {
  message: string;
}
interface ErrorResponse {
  response?: {
    data?: {
      errors?: Record<string, { msg?: string }>;
      message?: string;
    };
  };
}

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  const axiosError = error as ErrorResponse;
  if (axiosError?.response?.data) {
    const { errors, message } = axiosError.response.data;
    if (errors) {
      const firstError = Object.values(errors)[0];
      if (firstError?.msg) return firstError.msg;
    }
    if (message) return message;
  }
  const simpleError = error as ErrorWithMessage;
  if (simpleError?.message) {
    return simpleError.message;
  }

  return defaultMessage;
};
export const useUserActions = ({
  hasToken,
  verify,
  role,
  limit,
  page,
  searchQuery,
  id,
}: {
  hasToken: boolean;
  verify?: VerifyStatus;
  role?: "ADMIN" | "USER" | "STAFF" | "";
  limit?: number;
  page?: number;
  searchQuery?: string;
  id?: string;
}) => {
  const router = useRouter();
  const useCreateUser = useCreateUserMutation();  
  const queryClient = useQueryClient();
  const { data: detailUserData, refetch: refetchDetailUser, isLoading: isLoadingDetailUser } = useGetDetailUserQuery(id || "");
  const { data, refetch, isLoading, isFetching } = useGetAllUserQuery({
    page,
    limit,
    role: role || "",
    verify: verify || "",
  });
  const {
    data: statisticsData,
    refetch: refetchStatistics,
    isLoading: isLoadingStatistics,
  } = useGetAllStatisticsUserQuery();
  const {
    data: activeUserData,
    refetch: refetchActiveUser,
    isLoading: isLoadingActiveUser,
  } = useGetActiveUserQuery();
  const {
    data: newRegistrationStatsData,
    refetch: refetchNewRegistrationStats,
    isLoading: isLoadingNewRegistrationStats,
  } = useGetNewRegistrationStatsQuery();
  const {
    data: topRenterData,
    refetch: refetchTopRenter,
    isLoading: isLoadingTopRenter,
  } = useGetTopRenterQuery();
  const {
    data: searchData,
    refetch: refetchSearch,
    isLoading: isLoadingSearch,
  } = useGetSearchUserQuery(searchQuery || "");
  const getAllUsers = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetch();
  }, [hasToken, router, refetch]);
  const getAllStatistics = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchStatistics();
  }, [hasToken, router, refetchStatistics]);
  const getActiveUser = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchActiveUser();
  }, [hasToken, router, refetchActiveUser]);
  const getDetailUser = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchDetailUser();
  }, [hasToken, router, refetchDetailUser]);
  const getNewRegistrationStats = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchNewRegistrationStats();
  }, [hasToken, router, refetchNewRegistrationStats]);
  const getTopRenter = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchTopRenter();
  }, [hasToken, router, refetchTopRenter]);
  const { data: dashboardStatsData } = useGetDashboardStatsQuery();
  const getSearchUsers = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchSearch();
  }, [hasToken, router, refetchSearch]);
  const users = searchQuery && searchQuery.length > 0 ? searchData?.data : data?.data;
  const createUser = useCallback(
      async (userData: UserProfile) => {
        if (!hasToken) {
          router.push("/login");
          return;
        }
        useCreateUser.mutate(userData, {
          onSuccess: (result: { status: number; data?: { message?: string } }) => {
            if (result?.status === 201) {
              toast.success("Tạo người dùng thành công");
              queryClient.invalidateQueries({ queryKey: ["all", "user", page, limit, verify || "all", role || "all"] });
              queryClient.invalidateQueries({ queryKey: ["user-stats"] });
              if (searchQuery && searchQuery.length > 0) {
                refetchSearch();
              } else {
                refetch();
              }
            } else {
              const errorMessage =
                result?.data?.message || "Lỗi khi tạo người dùng";
              toast.error(errorMessage);
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(error, "Lỗi khi tạo người dùng");
            toast.error(errorMessage);
          },
        });
      },
      [hasToken, router, queryClient, useCreateUser, searchQuery, refetch, refetchSearch, limit, page, role, verify]
    );
  return {
    users: users,
    refetch,
    isLoading,
    isFetching,
    getAllUsers,
    statistics: statisticsData,
    refetchStatistics,
    getAllStatistics,
    isLoadingStatistics,
    activeUser: activeUserData,
    refetchActiveUser,
    getActiveUser,
    isLoadingActiveUser,
    newRegistrationStats: newRegistrationStatsData,
    refetchNewRegistrationStats,
    getNewRegistrationStats,
    isLoadingNewRegistrationStats,
    topRenter: topRenterData?.result.data,
    refetchTopRenter,
    getTopRenter,
    isLoadingTopRenter,
    getSearchUsers,
    createUser,
    paginationUser: data?.pagination,
    isLoadingSearch,
    totalRecordUser: data?.pagination?.totalRecords || 0,
    getDetailUser,
    detailUserData,
    isLoadingDetailUser,
    dashboardStatsData,
  };
};