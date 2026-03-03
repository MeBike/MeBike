import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import type { DetailUser } from "@/types";
import { UserProfile } from "@/schemas/userSchema";
import { ResetPasswordRequest } from "@/schemas/userSchema";
import { ApiResponse } from "@/types";
import {ENDPOINT} from "@/constants/end-point";
interface DetailUserResponse<T> {
  message: string;
  result: T;
}
export interface UserStatistics {
  total_users: number;
  total_verified: number;
  total_unverified: number;
  total_banned: number;
}
export interface ResetPasswordResponse {
  message: string;
}
export interface GetActiveStatisticsUser {
  active_users_count: number;
  date: string;
}
export interface TopRenterUser {
  total_rentals: number;
  user: {
    _id: string;
    fullname: string;
    email: string;
    phone_number: string;
    avatar: string;
    location: string;
  };
}
interface GetNewRegistrationStats {
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  percentageChange: number;
}
export interface DashboardUserStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  vipCustomer: {
    fullname: string;
    totalDuration: number;
  };
  totalRevenue: number;
  averageSpending: number;
}
export const userService = {
  getAllUsers: async ({
    page,
    pageSize,
    verify,
    role,
    fullname,
    sortBy,
    sortDir,
  }: {
    page?: number;
    pageSize?: number;
    verify?: "VERIFIED" | "UNVERIFIED" | "BANNED" | "";
    role?: "ADMIN" | "USER" | "STAFF" | "SOS" | "";
    fullname?: string;
    sortBy?: "fullname" | "email" | "role" | "verify" | "updatedAt";
    sortDir?: "asc" | "desc";
  }): Promise<AxiosResponse<ApiResponse<DetailUser[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<DetailUser[]>>(
      ENDPOINT.USER.BASE,
      {
        page: page,
        pageSize: pageSize,
        verify: verify,
        fullname: fullname,
        role: role,
        sortBy: sortBy,
        sortDir: sortDir,
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
  ): Promise<AxiosResponse<DetailUserResponse<DetailUser>>> => {
    const response = await fetchHttpClient.patch<
      DetailUserResponse<DetailUser>
    >(ENDPOINT.USER.UPDATE(id), data);
    return response;
  },
  userStatistics: async (): Promise<
    AxiosResponse<DetailUserResponse<UserStatistics>>
  > => {
    const response = await fetchHttpClient.get<
      DetailUserResponse<UserStatistics>
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
    AxiosResponse<DetailUserResponse<ApiResponse<TopRenterUser[]>>>
  > => {
    const response = await fetchHttpClient.get<
      DetailUserResponse<ApiResponse<TopRenterUser[]>>
    >(ENDPOINT.USER.STATS_TOP_RENTER);
    return response;
  },
  createUser: async (
    data: UserProfile
  ): Promise<AxiosResponse<DetailUserResponse<DetailUser>>> => {
    const response = await fetchHttpClient.post<DetailUserResponse<DetailUser>>(
      ENDPOINT.USER.CREATE_USER,
      data
    );
    return response;
  },
  getNewRegistrationStats: async (): Promise<
    AxiosResponse<DetailUserResponse<GetNewRegistrationStats>>
  > => {
    const response = await fetchHttpClient.get<
      DetailUserResponse<GetNewRegistrationStats>
    >(ENDPOINT.USER.NEW_USER);
    return response;
  },
  getActiveUser: async (): Promise<
    AxiosResponse<DetailUserResponse<GetActiveStatisticsUser[]>>
  > => {
    const response = await fetchHttpClient.get<
      DetailUserResponse<GetActiveStatisticsUser[]>
    >(ENDPOINT.USER.STATS_ACTIVE_USER);
    return response;
  },
  getDashboardUserStats: async (): Promise<
    AxiosResponse<DetailUserResponse<DashboardUserStats>>
  > => {
    const response = await fetchHttpClient.get<
      DetailUserResponse<DashboardUserStats>
    >(ENDPOINT.USER.DASHBOARD_USER_STATS);
    return response;
  },
  postResetPassword: async (
    id: string,
    data: ResetPasswordRequest
  ): Promise<AxiosResponse<DetailUserResponse<ResetPasswordResponse>>> => {
    const response = await fetchHttpClient.post<
      DetailUserResponse<ResetPasswordResponse>
    >(ENDPOINT.USER.RESET_PASSWORD(id), data);
    return response;
  },
  updateProfileAdmin: async (
    id: string,
    data: Partial<UserProfile>
  ): Promise<AxiosResponse<DetailUserResponse<DetailUser>>> => {
    const response = await fetchHttpClient.patch<
      DetailUserResponse<DetailUser>
    >(ENDPOINT.USER.UPDATE(id), data);
    return response;
  }
};
