import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import { DetailUser } from "./auth.service";
import { CreateUserFormData, UserProfile } from "@/schemas/userSchema";
import { GET_DETAIL_USER ,  GET_USERS , GET_USER_STATS , CHANGE_STATUS_USER , CREATE_USER} from "@/graphql";
import { print } from "graphql";
import { ResetPasswordRequest } from "@/schemas/userSchema";
import { GetUsersResponse, GetDetailUserResponse , CreateUserResponse} from "@/types/auth.type";
import { GetUserStatsResponse } from "@/types/user.type";
import { ChangeStatusUserResponse } from "@/types/auth.type";
interface ApiReponse<T> {
  data: T;
  pagination?: {
    totalPages: number;
    totalRecords: number;
    limit: number;
    currentPage: number;
  };
}
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
const USER_BASE = "/users/manage-users";
const USER_ENDPOINTS = {
  BASE: USER_BASE,
  MANAGE_USER: `${USER_BASE}/get-all`,
  SEARCH_USER: `${USER_BASE}/search`,
  BY_ID: (id: string) => `${USER_BASE}/${id}`,
  UPDATE: (id: string) => `${USER_BASE}/${id}`,
  RESET_USER_PASSWORD: (id: string) =>
    `${USER_BASE}/admin-reset-password/${id}`,
  STATISTICS: `${USER_BASE}/stats`,
  ACTIVE_USERS: `${USER_BASE}/active-users`,
  TOP_RENTERS: `${USER_BASE}/top-renters`,
  CREATE_USER: `${USER_BASE}/create`,
  GET_NEW_REGISRATION_STATS: `${USER_BASE}/stats/new-users`,
  GET_TOP_RENTER: `${USER_BASE}/stats/top-renters`,
  GET_ACTIVE_USERS: `${USER_BASE}/stats/active-users`,
  GET_USER_STATS: `${USER_BASE}/stats`,
  GET_ACTIVE_USER: `${USER_BASE}/stats`,
  DASHBOARD_USER_STATS: `${USER_BASE}/dashboard-stats`,
  RESET_PASSWORD: (id: string) => `${USER_BASE}/admin-reset-password/${id}`,
  UPDATE_PROFILE_ADMIN: (id: string) => `${USER_BASE}/${id}`,
} as const;
export const userService = {
  getAllUsers: async ({
    page,
    limit,
    verify,
    role,
    search
  }: {
    page?: number;
    limit?: number;
    verify?: "VERIFIED" | "UNVERIFIED" | "BANNED" | "";
    role?: "ADMIN" | "USER" | "STAFF" | "";
    search?: string;
  }): Promise<AxiosResponse<GetUsersResponse>> => {
    return fetchHttpClient.query<GetUsersResponse>(print(GET_USERS), {
      params: {
        page: page,
        limit: limit,
        verify: verify === "" ? undefined : verify,
        role: role === "" ? undefined : role,
        search: search,
      },
    });
  },
  getDetailUser: async (
    id: string
  ): Promise<AxiosResponse<GetDetailUserResponse>> => {
    const response = await fetchHttpClient.query<GetDetailUserResponse>(
      print(GET_DETAIL_USER),
      {
        params: id,
      }
    );
    return response;
  },
  getSearchUser: async (
    query: string
  ): Promise<AxiosResponse<ApiReponse<DetailUser[]>>> => {
    const response = await fetchHttpClient.get<ApiReponse<DetailUser[]>>(
      USER_ENDPOINTS.SEARCH_USER,
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
    >(USER_ENDPOINTS.UPDATE(id), data);
    return response;
  },
  userStatistics: async (): Promise<
    AxiosResponse<DetailUserResponse<UserStatistics>>
  > => {
    const response = await fetchHttpClient.get<
      DetailUserResponse<UserStatistics>
    >(USER_ENDPOINTS.STATISTICS);
    return response;
  },
  resetUserPassword: async (
    id: string
  ): Promise<AxiosResponse<DetailUserResponse<ResetPasswordResponse>>> => {
    const response = await fetchHttpClient.post<
      DetailUserResponse<ResetPasswordResponse>
    >(USER_ENDPOINTS.RESET_USER_PASSWORD(id));
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
    AxiosResponse<DetailUserResponse<ApiReponse<TopRenterUser[]>>>
  > => {
    const response = await fetchHttpClient.get<
      DetailUserResponse<ApiReponse<TopRenterUser[]>>
    >(USER_ENDPOINTS.GET_TOP_RENTER);
    return response;
  },
  createUser: async (
    data: CreateUserFormData
  ): Promise<AxiosResponse<CreateUserResponse>> => {
    const response = await fetchHttpClient.mutation<CreateUserResponse>(
      print(CREATE_USER),
      {
        body: {
          YOB: data.YOB,
          email: data.email,
          name: data.name,
          phone: data.phone,
          role: data.role,
        },
      }
    );
    return response;
  },
  getNewRegistrationStats: async (): Promise<
    AxiosResponse<DetailUserResponse<GetNewRegistrationStats>>
  > => {
    const response = await fetchHttpClient.get<
      DetailUserResponse<GetNewRegistrationStats>
    >(USER_ENDPOINTS.GET_NEW_REGISRATION_STATS);
    return response;
  },
  getActiveUser: async (): Promise<
    AxiosResponse<DetailUserResponse<GetActiveStatisticsUser[]>>
  > => {
    const response = await fetchHttpClient.get<
      DetailUserResponse<GetActiveStatisticsUser[]>
    >(USER_ENDPOINTS.GET_ACTIVE_USER);
    return response;
  },
  getDashboardUserStats: async (): Promise<
    AxiosResponse<GetUserStatsResponse>
  > => {
    return fetchHttpClient.query<GetUserStatsResponse>(print(GET_USER_STATS));
  },
  postResetPassword: async (
    id: string,
    data: ResetPasswordRequest
  ): Promise<AxiosResponse<DetailUserResponse<ResetPasswordResponse>>> => {
    const response = await fetchHttpClient.post<
      DetailUserResponse<ResetPasswordResponse>
    >(USER_ENDPOINTS.RESET_PASSWORD(id), data);
    return response;
  },
  updateProfileAdmin: async (
    id: string,
    data: Partial<UserProfile>
  ): Promise<AxiosResponse<DetailUserResponse<DetailUser>>> => {
    const response = await fetchHttpClient.patch<
      DetailUserResponse<DetailUser>
    >(USER_ENDPOINTS.UPDATE_PROFILE_ADMIN(id), data);
    return response;
  },
  changeStatus: async ({
    accountId,
    status
  }: {
    accountId: string;
    status: "Active" | "Inactive";
  }): Promise<AxiosResponse<ChangeStatusUserResponse>> => {
    const response = await fetchHttpClient.mutation<ChangeStatusUserResponse>(
      print(CHANGE_STATUS_USER),
      {
        data: {
          accountId : accountId,
          status : status,
        },
      }
    );
    return response;
  },
};
