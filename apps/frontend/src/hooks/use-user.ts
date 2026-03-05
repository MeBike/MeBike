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
import { useGetDetailUserQuery } from "./query/User/useGetDetailUserQuery";
import { useGetDashboardStatsQuery } from "./query/User/useGetDashboardStatsQuery";
import { CreateUserFormData, ResetPasswordRequest } from "@/schemas/userSchema";
import { useResetPasswordUserMutation } from "./mutations/User/useResetPasswordMutation";
import { UserProfile } from "@/schemas/userSchema";
import { useUpdateProfileUserMutation } from "./mutations/User/useUpdateProfileUserMutation";
import { QUERY_KEYS } from "@/constants/queryKey";
import getAxiosErrorCodeMessage from "@/utils/error-util";
import { getErrorMessageFromCustomerCode } from "@/utils/map-message";
export const useUserActions = ({
  hasToken,
  verify,
  role,
  limit,
  page,
  searchQuery,
  fullName,
  id,
}: {
  hasToken: boolean;
  verify?: VerifyStatus;
  role?: "ADMIN" | "USER" | "STAFF" | "SOS" | "";
  limit?: number;
  page?: number;
  searchQuery?: string;
  id?: string;
  fullName?: string;
}) => {
  const router = useRouter();
  const useCreateUser = useCreateUserMutation();
  const queryClient = useQueryClient();
  const {
    data: detailUserData,
    refetch: refetchDetailUser,
    isLoading: isLoadingDetailUser,
  } = useGetDetailUserQuery(id || "");
  const { data, refetch, isLoading, isFetching } = useGetAllUserQuery({
    page: page,
    pageSize: limit,
    role: role || "",
    verify: verify || "",
    fullName: fullName || "",
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
  const { data: dashboardStatsData, refetch: refetchDashboardStats } =
    useGetDashboardStatsQuery();
  const getRefetchDashboardStats = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchDashboardStats();
  }, [hasToken, router, refetchDashboardStats]);
  const getSearchUsers = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchSearch();
  }, [hasToken, router, refetchSearch]);
  const users =
    searchQuery && searchQuery.length > 0 ? searchData?.data : data?.data;
  const createUser = useCallback(
    async (userData: CreateUserFormData) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useCreateUser.mutateAsync(userData);
        if (result?.status === 201) {
          queryClient.invalidateQueries({
            queryKey: ["user", "all"],
          });
          queryClient.invalidateQueries({
            queryKey: ["user", "statistics"],
          });
          queryClient.invalidateQueries({
            queryKey: ["user", "dashboard-stats"],
          });
          toast.success("Tạo người dùng thành công");
        }
        return result;
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        const errorMessage = getErrorMessageFromCustomerCode(error_code);
        toast.error(errorMessage);
        throw error;
      }
    },
    [
      hasToken,
      router,
      queryClient,
      useCreateUser,
      searchQuery,
      refetch,
      refetchSearch,
      limit,
      page,
      role,
      verify,
    ],
  );
  const useResetPassword = useResetPasswordUserMutation();
  const useUpdateProfile = useUpdateProfileUserMutation();
  const resetPassword = useCallback(
    async (userData: ResetPasswordRequest) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useResetPassword.mutateAsync({
          id: id || "",
          data: userData,
        });
        if (result.status === 200) {
          toast.success(result.data?.message || "Đặt lại mật khẩu thành công");
        }
        queryClient.invalidateQueries({
          queryKey: ["user", "all"],
        });
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        const errorMessage = getErrorMessageFromCustomerCode(error_code);
        toast.error(errorMessage);
        throw error;
      }
    },
    [hasToken, router, useResetPassword, id],
  );
  const updateProfileUser = useCallback(
    async (userData: UserProfile) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useUpdateProfile.mutateAsync({
          id: id || "",
          data: userData,
        });
        if (result.status === 200) {
          toast.success(
            result.data?.message || "Cập nhật thông tin thành công",
          );
        }
        queryClient.invalidateQueries({
          queryKey: ["user", "all"],
        });
        queryClient.invalidateQueries({
          queryKey: ["user", "detail", id],
        });
        refetchDetailUser();
        refetch();
        return result;
      } catch (error) {
        const error_code = getAxiosErrorCodeMessage(error);
        const errorMessage = getErrorMessageFromCustomerCode(error_code);
        toast.error(errorMessage);
        throw error;
      }
    },
    [
      hasToken,
      useUpdateProfile,
      router,
      queryClient,
      id,
      refetchDetailUser,
      refetch,
      page,
      limit,
      verify,
      role,
    ],
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
    topRenter: topRenterData,
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
    resetPassword,
    updateProfileUser,
    getRefetchDashboardStats,
  };
};
