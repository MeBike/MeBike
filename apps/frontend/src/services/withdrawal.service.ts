import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import type {
  WithdrawRequest,
  WithdrawStatus,
  DetailWithdrawRequest,
  WithdrawalOverview
} from "@/types";
import { UpdateWithdrawSchemaFormData } from "@/schemas/withdrawalSchema";
interface ApiResponse<T> {
  data: T[];
  pagination: {
    totalPages: number;
    currentPage: number;
    limit: number;
    totalRecords: number;
  };
}
interface DetailApiResponse<T> {
  result: T;
  message: string;
}
const WITHDRAW_BASE = "/withdraws";
const WITHDRAW_ENDPOINTS = {
  BASE: WITHDRAW_BASE,
  MANAGE_WITHDRAW_REQUEST: () => `${WITHDRAW_BASE}/manage-withdrawal`,
  ID: (id: string) => `${WITHDRAW_BASE}/${id}`,
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
        page: page,
        limit: limit,
        status: status,
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
  getOverview: async (): Promise<AxiosResponse<DetailApiResponse<WithdrawalOverview>>> => {
    const response = await fetchHttpClient.get<DetailApiResponse<WithdrawalOverview>>(WITHDRAW_ENDPOINTS.OVERVIEW());
    return response;
  }
};
