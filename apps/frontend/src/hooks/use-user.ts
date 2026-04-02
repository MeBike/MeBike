import { useQueryClient } from "@tanstack/react-query";
import { useGetAllUserQuery } from "./query/User/useGetAllUserQuery";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useGetDetailUserQuery,
  useGetAllStatisticsUserQuery,
  useGetActiveUserQuery,
  useGetNewRegistrationStatsQuery,
  useGetTopRenterQuery,
  useGetSearchUserQuery,
  useGetDashboardStatsQuery,
  useGetStaffOnlyQuery
} from "@queries";
import {
  useCreateUserMutation,
  useResetPasswordUserMutation,
  useUpdateProfileStaffMutation,
  useUpdateProfileUserMutation,
} from "@mutations";
import {
  UserProfile,
  CreateUserFormData,
  ResetPasswordSchemaFormData,
  UpdateStaffFormData,
  UpdateUserFormData,
} from "@schemas";
import { HTTP_STATUS } from "@constants";
import {
  getErrorMessageFromCustomerCode,
  getAxiosErrorCodeMessage,
} from "@utils";
import type { UserActionProps } from "@custom-types";

type UserActionArgs = UserActionProps & {
  accountStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED" | "";
};

const toManageableUserRole = (role?: UserActionProps["role"]): "ADMIN" | "USER" | "STAFF" | "" => {
  if (role === "ADMIN" || role === "USER" || role === "STAFF") {
    return role;
  }

  return "";
};

export const useUserActions = ({
  hasToken,
  verify,
  accountStatus,
  role,
  limit,
  page,
  searchQuery,
  fullName,
  id,
}: UserActionArgs) => {
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
    role: toManageableUserRole(role),
    verify: verify || "",
    accountStatus: accountStatus || "",
    fullName: fullName || "",
  });
  const { data : staffOnly , isLoading : isLoadingStaffOnly,
    refetch : refetchStaff,
   } = useGetStaffOnlyQuery({
    page : page,
    pageSize : limit
  });
  const pagination = data?.pagination as
    | { total?: number; totalRecords?: number }
    | undefined;
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
  const getAllStaffs = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchStaff();
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
        if (result?.status === HTTP_STATUS.CREATED) {
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
  const useUpdateStaff = useUpdateProfileStaffMutation();
  const useUpdateUser = useUpdateProfileUserMutation();
  const resetPassword = useCallback(
    async (userData: ResetPasswordSchemaFormData) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useResetPassword.mutateAsync({
          id: id || "",
          data: userData,
        });
        if (result.status === HTTP_STATUS.OK) {
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
  const updateProfileStaff = useCallback(
    async (userData: UpdateStaffFormData) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useUpdateStaff.mutateAsync({
          id: id || "",
          data: userData,
        });
        
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
      useUpdateStaff,
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
  const updateProfileUser = useCallback(
    async (userData: UpdateUserFormData) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      try {
        const result = await useUpdateUser.mutateAsync({
          id: id || "",
          data: userData,
        });
        
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
      useUpdateUser,
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
    topRenter: topRenterData?.data,
    refetchTopRenter,
    getTopRenter,
    isLoadingTopRenter,
    getSearchUsers,
    createUser,
    paginationUser: data?.pagination,
    isLoadingSearch,
    totalRecordUser: pagination?.total ?? pagination?.totalRecords ?? 0,
    getDetailUser,
    detailUserData,
    isLoadingDetailUser,
    dashboardStatsData,
    resetPassword,
    updateProfileStaff,
    getRefetchDashboardStats,
    staffOnly,
    updateProfileUser,
    isLoadingStaffOnly,
    getAllStaffs
  };
};
