import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
interface ApiResponse<T> {
  data: T;
  pagination: {
    totalPages: number;
    currentPage: number;
    limit: number;
    totalRecords: number;
  };
  message: string;
}
interface DetailApiResponse<T> {
  result: T;
  message: string;
}
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
interface Wallet {
  _id: string;
  user_id: string;
  balance: number;
  status : "ĐANG HOẠT ĐỘNG" | "KHÓA";
  created_at : string;
  updated_at : string;
}
const WALLET_BASE = "/wallets";
const WALLET_ENDPOINTS = {
  BASE: WALLET_BASE,
  MY_WALLET: `${WALLET_BASE}/my-wallet`,
  TOP_UP: `${WALLET_BASE}/increase`,
  DEBIT: `${WALLET_BASE}/decrease`,
  GET_ALL_WALLET_USER: `${WALLET_BASE}/manage-wallet`,
} as const;
import type { TopUpSchemaFormData , DecreaseSchemaFormData } from "@/schemas/walletSchema";
export const walletService = {
  getMyWallet: async (): Promise<AxiosResponse<MyWallet>> => {
    const response = await fetchHttpClient.get<MyWallet>(
      WALLET_ENDPOINTS.MY_WALLET
    );
    return response;
  },
  topUpWallet: async (
    data: TopUpSchemaFormData
  ): Promise<AxiosResponse<MyWallet>> => {
    const response = await fetchHttpClient.put<MyWallet>(
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
  getAllWalletUser: async (): Promise<AxiosResponse<ApiResponse<Wallet[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Wallet[]>>(
      WALLET_ENDPOINTS.GET_ALL_WALLET_USER
    );
    return response;
  },
};