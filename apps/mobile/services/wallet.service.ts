import type { DecreaseSchemaFormData, TopUpSchemaFormData } from "@schemas/walletSchema";
import type { AxiosResponse } from "axios";

import fetchHttpClient from "@lib/httpClient";

export type MyWallet = {
  _id: string;
  user_id: string;
  balance: {
    $numberDecimal: string;
  };
  status: "ĐANG HOẠT ĐỘNG" | "KHÓA";
  created_at: string;
  updated_at: string;
};
export type Transaction = {
  _id: string;
  wallet_id: string;
  amount: number;
  fee: number;
  description: string;
  transaction_hash: string;
  type: "NẠP TIỀN" | "RÚT TIỀN" | "THANH TOÁN";
  created_at: string;
  updated_at: string;
  status: "THÀNH CÔNG" | "THẤT BẠI" | "ĐANG XỬ LÝ";
};
const WALLET_BASE = "/wallets";
const WALLET_ENDPOINTS = {
  BASE: WALLET_BASE,
  MY_WALLET: `${WALLET_BASE}`,
  TOP_UP: `${WALLET_BASE}/increase`,
  DEBIT: `${WALLET_BASE}/decrease`,
  TRANSACTIONS: `${WALLET_BASE}/transaction`,
  TRANSACTION_DETAIL: (id: string) => `${WALLET_BASE}/transaction/${id}`,
} as const;
type ApiResponse<T> = {
  message: string;
  data?: T;
  result?: T;
};

export const walletService = {
  getMyWallet: async (): Promise<AxiosResponse<ApiResponse<MyWallet>>> => {
    return await fetchHttpClient.get<ApiResponse<MyWallet>>(
      WALLET_ENDPOINTS.MY_WALLET,
    );
  },
  topUpWallet: async (
    data: TopUpSchemaFormData,
  ): Promise<AxiosResponse<ApiResponse<MyWallet>>> => {
    const response = await fetchHttpClient.put<ApiResponse<MyWallet>>(
      WALLET_ENDPOINTS.TOP_UP,
      data,
    );
    return response;
  },
  debitWallet: async (
    data: DecreaseSchemaFormData,
  ): Promise<AxiosResponse<MyWallet>> => {
    const response = await fetchHttpClient.put<MyWallet>(
      WALLET_ENDPOINTS.DEBIT,
      data,
    );
    return response;
  },
  transactions: async ({ page, limit }: { page: number; limit: number }): Promise<AxiosResponse<ApiResponse<Transaction[]>>> => {
    return await fetchHttpClient.get<ApiResponse<Transaction[]>>(
      WALLET_ENDPOINTS.TRANSACTIONS,
      {
        page,
        limit,
      },
    );
  },
  getTransactionDetail: async (transactionId: string): Promise<AxiosResponse<ApiResponse<Transaction>>> => {
    return await fetchHttpClient.get<ApiResponse<Transaction>>(
      WALLET_ENDPOINTS.TRANSACTION_DETAIL(transactionId),
    );
  },
};
