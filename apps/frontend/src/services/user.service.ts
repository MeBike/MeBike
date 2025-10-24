import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import { DetailUser } from "./auth.service";
import { UserProfile } from "@/schemas/userSchema";
import { create } from "domain";
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
} as const;
export const userService = {
  getAllUsers: async ({
    page,
    limit,
    verify,
    role,
  }: {
    page?: number;
    limit?: number;
    verify: "VERIFIED" | "UNVERIFIED" | "BANNED" | "";
    role?: "ADMIN" | "USER" | "STAFF" | "";
  }): Promise<AxiosResponse<ApiReponse<DetailUser[]>>> => {
    const response = await fetchHttpClient.get<ApiReponse<DetailUser[]>>(
      USER_ENDPOINTS.MANAGE_USER,
      {
        page: page,
        limit: limit,
        verify: verify,
        role: role,
      }
    );
    return response;
  },
  getDetailUser: async (
    id: string
  ): Promise<ApiReponse<DetailUserResponse<DetailUser>>> => {
    const response = await fetchHttpClient.get<DetailUserResponse<DetailUser>>(
      USER_ENDPOINTS.BY_ID(id)
    );
    return response;
  },
  getSearchUser: async (
    query: string
  ): Promise<ApiReponse<DetailUserResponse<DetailUser[]>>> => {
    const response = await fetchHttpClient.get<
      DetailUserResponse<DetailUser[]>
    >(USER_ENDPOINTS.SEARCH_USER, {
      q: query,
    });
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
    AxiosResponse<ApiReponse<UserStatistics>>
  > => {
    const response = await fetchHttpClient.get<ApiReponse<UserStatistics>>(
      USER_ENDPOINTS.STATISTICS
    );
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
  getActiveUserStats: async (): Promise<
    AxiosResponse<ApiReponse<GetActiveStatisticsUser[]>>
  > => {
    const response = await fetchHttpClient.get<
      ApiReponse<GetActiveStatisticsUser[]>
    >(USER_ENDPOINTS.ACTIVE_USERS);
    return response;
  },
  getTopRenter: async (): Promise<
    AxiosResponse<DetailUserResponse<ApiReponse<TopRenterUser[]>>>
  > => {
    const response = await fetchHttpClient.get<
      DetailUserResponse<ApiReponse<TopRenterUser[]>>
    >(USER_ENDPOINTS.TOP_RENTERS);
    return response;
  },
  createUser: async (
    data: UserProfile
  ): Promise<AxiosResponse<DetailUserResponse<DetailUser>>> => {
    const response = await fetchHttpClient.post<
      DetailUserResponse<DetailUser>
    >(USER_ENDPOINTS.CREATE_USER, data);
    return response;
  },
};
