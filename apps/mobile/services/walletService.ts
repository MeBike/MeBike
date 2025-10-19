import fetchHttpClient from "@lib/httpClient";
import type { AxiosResponse } from "axios";
export interface MyWallet {
  _id: string;
  user_id: string;
  balance: {
    $numberDecimal : string;
  };
  status : "ĐANG HOẠT ĐỘNG" | "KHÓA";
  created_at : string;
  updated_at : string;
}
const WALLET_BASE = "/wallets";
const WALLET_ENDPOINTS = {
  BASE: WALLET_BASE,
  MY_WALLET: `${WALLET_BASE}`,
  TOP_UP: `${WALLET_BASE}/increase`,
  DEBIT: `${WALLET_BASE}/decrease`,
} as const;
interface ApiResponse<T> {
  message: string;
  result: T;
}
import type { TopUpSchemaFormData , DecreaseSchemaFormData } from "@schemas/walletSchema";
export const walletService = {
  getMyWallet: async (): Promise<AxiosResponse<ApiResponse<MyWallet>>> => {
    return await fetchHttpClient.get<ApiResponse<MyWallet>>(
      WALLET_ENDPOINTS.MY_WALLET
    );
  },
  topUpWallet: async (
    data: TopUpSchemaFormData
  ): Promise<AxiosResponse<ApiResponse<MyWallet>>> => {
    const response = await fetchHttpClient.put<ApiResponse<MyWallet>>(
      WALLET_ENDPOINTS.TOP_UP,
      data
    );
    return response;
  },
  debitWallet: async (
    data: DecreaseSchemaFormData
  ): Promise<AxiosResponse<MyWallet>> => {
    const response = await fetchHttpClient.put<MyWallet>(
      WALLET_ENDPOINTS.DEBIT,
      data
    );
    return response;
  },
};