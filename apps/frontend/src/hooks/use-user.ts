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
import { ResetPasswordRequest } from "@/schemas/userSchema";
import { useResetPasswordUserMutation } from "./mutations/User/useResetPasswordMutation";
import { UserProfile } from "@/schemas/userSchema";
import { useUpdateProfileUserMutation } from "./mutations/User/useUpdateProfileUserMutation";
import { QUERY_KEYS , HTTP_STATUS , MESSAGE} from "@constants/index";
import { getErrorMessage } from "@/utils/message";
import type { Me } from "@/types/GraphQL";
import type { DetailUser } from "@/services/auth.service";
import { useChangeStatusMutation } from "./mutations/User/useChangeStatusMutation";
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
  role?: "ADMIN" | "USER" | "STAFF" | "SOS" | "";
  limit?: number;
  page?: number;
  searchQuery?: string;
  id?: string;
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
  }, [hasToken, router, refetchDetailUser , id]);
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
  const { data: dashboardStatsData , refetch : refetchDashboardStats } = useGetDashboardStatsQuery();
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
  const users: Me[] =
    searchQuery && searchQuery.length > 0
      ? (searchData?.data || []).map((user: DetailUser) => ({
          id: user._id,
          accountId: user._id,
          name: user.fullname,
          YOB: 0,
          role: user.role,
          verify: user.verify,
          email: user.email,
          status: "active",
          phone: user.phone_number,
          userAccount: {
            email: user.email,
            id: user._id,
            password: "",
          },
          address: user.location,
          location: user.location,
          avatarUrl: user.avatar,
          username: user.username,
          createdAt: user.created_at,
          nfcCardUid: user.nfc_card_uid,
          updatedAt: user.updated_at,
        }))
      : data?.data?.Users.data || [];
  const createUser = useCallback(
    async (userData: UserProfile) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      useCreateUser.mutate(userData, {
        onSuccess: (result) => {
          if (result?.status === HTTP_STATUS.CREATED) {
            toast.success(result.data?.data?.CreateUser.message || MESSAGE.CREATE_USER_SUCCESS);
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.USER.ALL(),
            });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.STATISTICS });
            if (searchQuery && searchQuery.length > 0) {
              refetchSearch();
            } else {  
              refetch();
            }
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(error, MESSAGE.CREATE_USER_FAILED);
          toast.error(errorMessage);
        },
      });
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
    ]
  );
  const useResetPassword = useResetPasswordUserMutation();
  const useUpdateProfile = useUpdateProfileUserMutation();
  const resetPassword = useCallback(
    async (userData: ResetPasswordRequest) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      useResetPassword.mutate({id: id || "", data: userData}, {
        onSuccess: (result: {
          status: number;
          data?: { message?: string };
        }) => {
          if (result?.status === HTTP_STATUS.OK) {
            toast.success(result.data?.message || MESSAGE.UPDATE_PASSWORD_USER_SUCCESS);
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(error, MESSAGE.UPDATE_PASSWORD_USER_FAILED);
          toast.error(errorMessage);
        },
      });
    },
    [
      hasToken,
      router,
      id,
      useResetPassword,
    ]
  );
  const useChangeStatusUser = useChangeStatusMutation();
  const changeStatusUser = useCallback(
    async ({accountId , status}: {accountId : string , status : "Active" | "Inactive"}) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      useChangeStatusUser.mutate(
        { accountId: accountId || "", status: status },
        {
          onSuccess: (result) => {
            if (result?.status === HTTP_STATUS.OK) {
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.USER.ALL(),
              });
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.USER.STATISTICS,
              });
              refetchDetailUser();
              refetch();
              toast.success(MESSAGE.UPDATE_PROFILE_SUCCESS);
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(
              error,
              MESSAGE.UPDATE_PROFILE_FAILED
            );
            toast.error(errorMessage);
          },
        }
      );
    },
    [
      hasToken,
      router,
      id,
      useChangeStatusUser,
      queryClient,
      refetchDetailUser,
      refetch,
    ]
  );
  const updateProfileUser = useCallback(
    async (userData: UserProfile) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      useUpdateProfile.mutate(
        { id: id || "", data: userData },
        {
          onSuccess: (result: {
            status: number;
            data?: { message?: string };
          }) => {
            if (result?.status === HTTP_STATUS.OK) {
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.USER.ALL(),
              });
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.STATISTICS });
              refetchDetailUser();
              refetch();
              toast.success(MESSAGE.UPDATE_PROFILE_SUCCESS);
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(
              error,
              MESSAGE.UPDATE_PROFILE_FAILED
            );
            toast.error(errorMessage);
          },
        }
      );
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
    ]
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
    paginationUser: data?.data?.Users.pagination,
    isLoadingSearch,
    totalRecordUser: data?.data?.Users?.total || 0,
    getDetailUser,
    detailUserData: detailUserData?.data.data?.User?.data,
    isLoadingDetailUser,
    dashboardStatsData,
    resetPassword,
    updateProfileUser,
    getRefetchDashboardStats,
    changeStatusUser,
  };
};
