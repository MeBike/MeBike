import type { CreateWithdrawSchemaFormData, UpdateWithdrawSchemaFormData } from "@schemas/withDrawalSchema";
import type { AxiosResponse } from "axios";

import fetchHttpClient from "@lib/httpClient";

import type {
  DetailWithdrawRequest,
  WithdrawRequest,
  WithdrawStatus,
} from "../types/Withdrawal";

type ApiResponse<T> = {
  data: T[];
  pagination: {
    totalPages: number;
    currentPage: number;
    limit: number;
    totalRecords: number;
  };
};
type DetailApiResponse<T> = {
  result: T;
  message: string;
};
const WITHDRAW_BASE = "/withdraws";
const WITHDRAW_ENDPOINTS = {
  BASE: WITHDRAW_BASE,
  MANAGE_WITHDRAW_REQUEST: () => `${WITHDRAW_BASE}/manage-withdrawal`,
  ID: (id: string) => `${WITHDRAW_BASE}/${id}`,
  WITHDRAW_REQUESTS: () => `${WITHDRAW_BASE}`,
  OVERVIEW : () => `${WITHDRAW_BASE}/overview`,
} as const;
export const withdrawalsService = {
  getAllWithdrawRequests: async ({
    page,
    limit,
    status,
  }: {
    page?: number;
    limit?: number;
    status: WithdrawStatus;
  }): Promise<AxiosResponse<ApiResponse<WithdrawRequest>>> => {
    const response = await fetchHttpClient.get<ApiResponse<WithdrawRequest>>(
      WITHDRAW_ENDPOINTS.MANAGE_WITHDRAW_REQUEST(),
      {
        page,
        limit,
        status,
      }
    );
    return response;
  },
  getWithdrawRequestById: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<DetailWithdrawRequest>>> => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<DetailWithdrawRequest>
    >(WITHDRAW_ENDPOINTS.ID(id));
    return response;
  },
  updateWithdrawRequestById: async (
    id: string,
    data: UpdateWithdrawSchemaFormData
  ): Promise<AxiosResponse<DetailApiResponse<DetailWithdrawRequest>>> => {
    const response = await fetchHttpClient.put<
      DetailApiResponse<DetailWithdrawRequest>
    >(WITHDRAW_ENDPOINTS.ID(id), data);
    return response;
  },
  getWithdrawRequests: async ({
    page,
    limit,
  }: {
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<WithdrawRequest[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<WithdrawRequest[]>>(
      WITHDRAW_ENDPOINTS.WITHDRAW_REQUESTS(),
      {
        page,
        limit,
      }
    );
    return response;
  },
  createWithdrawRequest: async (
    data: CreateWithdrawSchemaFormData
  ): Promise<AxiosResponse<DetailApiResponse<DetailWithdrawRequest>>> => {
    const response = await fetchHttpClient.post<
      DetailApiResponse<DetailWithdrawRequest>
    >(WITHDRAW_ENDPOINTS.WITHDRAW_REQUESTS(), data);
    return response;
  },
};
