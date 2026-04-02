import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import type { DetailUser } from "@/types";
import { CreateUserFormData, UserProfile ,UpdateStaffFormData , UpdateUserFormData} from "@/schemas/user-schema";
import { ResetPasswordSchemaFormData } from "@schemas";
import { ApiResponse } from "@/types";
import {ENDPOINT} from "@/constants/end-point";
import { GetActiveUserStatisticsResponse , GetNewRegistrationStats , GetUserStatisticsResponse  , GetUserDashboardStatsResponse , GetTopRentersResponse } from "@/types";
import page from "@/app/admin/bikes/page";
interface DetailUserResponse<T> {
  message: string;
  result: T;
}
export interface ResetPasswordResponse {
  message: string;
}
export const userService = {
  getAllUsers: async ({
    page,
    pageSize,
    verify,
    accountStatus,
    fullName,
    sortBy,
    sortDir,
  }: {
    page?: number;
    pageSize?: number;
    verify?: "VERIFIED" | "UNVERIFIED" | "";
    accountStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED" | "";
    fullName?: string;
    sortBy?: "fullname" | "email" | "role" | "accountStatus" | "verify" | "updatedAt";
    sortDir?: "asc" | "desc";
  }): Promise<AxiosResponse<ApiResponse<DetailUser[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<DetailUser[]>>(
      ENDPOINT.USER.BASE,
      {
        page: page,
        pageSize: 7,
        verify: verify,
        accountStatus: accountStatus,
        fullName: fullName,
        role: "USER",
        sortBy: sortBy,
        sortDir: sortDir,
      }
    );
    return response;
  },
  getStaffOnly : async ({page , pageSize}: {page?: number; pageSize?: number}): Promise<AxiosResponse<ApiResponse<DetailUser[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<DetailUser[]>>(
      ENDPOINT.USER.BASE,{
        roles : "STAFF,TECHNICIAN,AGENCY,MANAGER",
        page : page || 1,
        pageSize : pageSize || 7,
      }
    );
    return response;
  },
  getDetailUser: async (
    id: string
  ): Promise<AxiosResponse<DetailUser>> => {
    const response = await fetchHttpClient.get<DetailUser>(
      ENDPOINT.USER.DETAIL(id)
    );
    return response;
  },
  getSearchUser: async (
    query: string
  ): Promise<AxiosResponse<ApiResponse<DetailUser[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<DetailUser[]>>(
      ENDPOINT.USER.SEARCH_USER,
      {
        q: query,
      }
    );
    return response;
  },
  updateUser: async (
    id: string,
    data: Partial<UserProfile>
  ): Promise<AxiosResponse<DetailUser>> => {
    const response = await fetchHttpClient.patch<DetailUser>(
      ENDPOINT.USER.UPDATE(id),
      data
    );
    return response;
  },
  userStatistics: async (): Promise<
    AxiosResponse<GetUserStatisticsResponse>
  > => {
    const response = await fetchHttpClient.get<
      GetUserStatisticsResponse
    >(ENDPOINT.USER.STATS_USER);
    return response;
  },
  resetUserPassword: async (
    id: string
  ): Promise<AxiosResponse<DetailUserResponse<ResetPasswordResponse>>> => {
    const response = await fetchHttpClient.post<
      DetailUserResponse<ResetPasswordResponse>
    >(ENDPOINT.USER.RESET_PASSWORD(id));
    return response;
  },
  // getActiveUserStats: async (): Promise<
  //   AxiosResponse<ApiReponse<GetActiveStatisticsUser[]>>
  // > => {
  //   const response = await fetchHttpClient.get<
  //     ApiReponse<GetActiveStatisticsUser[]>
  //   >(USER_ENDPOINTS.ACTIVE_USERS);
  //   return response;
  // },
  getTopRenter: async (): Promise<
    AxiosResponse<ApiResponse<GetTopRentersResponse[]>>
  > => {
    const response = await fetchHttpClient.get<
      ApiResponse<GetTopRentersResponse[]>
    >(ENDPOINT.USER.STATS_TOP_RENTER);
    return response;
  },
  createUser: async (
    data: CreateUserFormData
  ): Promise<AxiosResponse<DetailUser>> => {
    const response = await fetchHttpClient.post<DetailUser>(
      ENDPOINT.USER.CREATE_USER,
      data
    );
    return response;
  },
  getNewRegistrationStats: async (): Promise<
    AxiosResponse<GetNewRegistrationStats>
  > => {
    const response = await fetchHttpClient.get<
      GetNewRegistrationStats
    >(ENDPOINT.USER.NEW_USER);
    return response;
  },
  getActiveUser: async (): Promise<
    AxiosResponse<DetailUserResponse<GetActiveUserStatisticsResponse[]>>
  > => {
    const response = await fetchHttpClient.get<
      DetailUserResponse<GetActiveUserStatisticsResponse[]>
    >(ENDPOINT.USER.STATS_ACTIVE_USER);
    return response;
  },
  getDashboardUserStats: async (): Promise<
    AxiosResponse<GetUserDashboardStatsResponse>
  > => {
    const response = await fetchHttpClient.get<
      GetUserDashboardStatsResponse
    >(ENDPOINT.USER.DASHBOARD_USER_STATS);
    return response;
  },
  postResetPassword: async (
    id: string,
    data: ResetPasswordSchemaFormData
  ): Promise<AxiosResponse> => {
    const response = await fetchHttpClient.post(ENDPOINT.USER.RESET_PASSWORD(id), data);
    return response;
  },
  updateProfileAdmin: async (
    id: string,
    data: Partial<UpdateStaffFormData>
  ): Promise<AxiosResponse<DetailUser>> => {
    const response = await fetchHttpClient.patch<
      DetailUser
    >(ENDPOINT.USER.UPDATE(id), data);
    return response;
  },
  updateProfileUser: async (
    id: string,
    data: Partial<UpdateUserFormData>
  ): Promise<AxiosResponse<DetailUser>> => {
    const response = await fetchHttpClient.patch<
      DetailUser
    >(ENDPOINT.USER.UPDATE(id), data);
    return response;
  }
};
