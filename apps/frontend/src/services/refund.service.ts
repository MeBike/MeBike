import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import type { RefundRequest , RefundStatus} from "@/types";
import { get } from "http";
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
const REFUND_BASE = "/refunds";
const REFUND_ENDPOINTS = {
  BASE: REFUND_BASE,
  MANAGE_REFUND_REQUEST: () => `${REFUND_BASE}/manage-refunds`,
} as const;
export const refundService = {
    getAllRefundRequests: async ({
    page,
    limit,
    status,
  }: {
    page?: number;
    limit?: number;
    status: RefundStatus;
    }): Promise<AxiosResponse<ApiResponse<RefundRequest>>> => { 
    const response = await fetchHttpClient.get<ApiResponse<RefundRequest>>(
        REFUND_ENDPOINTS.MANAGE_REFUND_REQUEST(),
        {
        page: page,
        limit: limit,
        status: status,
        }
    );
    return response;
  }
};