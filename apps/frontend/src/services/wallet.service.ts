import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import { WalletOverview , DetailWallet } from "@/types/Wallet";
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
    $numberDecimal: string;
  };
  status: "ĐANG HOẠT ĐỘNG" | "KHÓA";
  created_at: string;
  updated_at: string;
}
export interface ManageTransactionsResponse {
  _id: string;
  wallet_id: string;
  rental_id: string;
  amount: number;
  fee: number;
  description: string;
  transaction_hash: string;
  type: "CỘNG TIỀN" | "RÚT TIỀN" | "HOÀN TIỀN" | "ĐẶT TRƯỚC" | "NẠP TIỀN";
  status: "THÀNH CÔNG" | "THẤT BẠI" | "ĐANG XỬ LÝ";
  created_at: string;
}
export interface Wallet {
  _id: string;
  user_id: string;
  balance: number;
  status: "ĐANG HOẠT ĐỘNG" | "ĐÃ BỊ ĐÓNG BĂNG";
  created_at: string;
  updated_at: string;
  fullname: string;
}
export interface UpdateWalletStatusResponse {
  _id: string;
  user_id: string;
  balance: {
    $numberDecimal: string;
  };
  status : "ĐANG HOẠT ĐỘNG" | "ĐÃ BỊ ĐÓNG BĂNG";
  created_at: string;
  updated_at: string;
}
const WALLET_BASE = "/wallets";
const WALLET_ENDPOINTS = {
  BASE: WALLET_BASE,
  MY_WALLET: `${WALLET_BASE}/my-wallet`,
  TOP_UP: `${WALLET_BASE}/increase`,
  DEBIT: `${WALLET_BASE}/decrease`,
  GET_ALL_WALLET_USER: `${WALLET_BASE}/manage-wallet`,
  MANAGE_TRANSACTIONS: `${WALLET_BASE}/manage-transactions`,
  OVERVIEW: `${WALLET_BASE}/overview`,
  DETAIL_WALLET: (user_id: string) => `${WALLET_BASE}/manage-wallet/${user_id}`,
  UPDATE_STATUS: (id: string) => `${WALLET_BASE}/${id}`,
} as const;
import type {
  TopUpSchemaFormData,
  DecreaseSchemaFormData,
} from "@/schemas/walletSchema";
export const walletService = {
  topUpWallet: async (
    data: TopUpSchemaFormData
  ): Promise<AxiosResponse<DetailApiResponse<MyWallet>>> => {
    const response = await fetchHttpClient.put<DetailApiResponse<MyWallet>>(
      WALLET_ENDPOINTS.TOP_UP,
      data
    );
    return response;
  },
  debitWallet: async (
    data: DecreaseSchemaFormData
  ): Promise<AxiosResponse<DetailApiResponse<MyWallet>>> => {
    const response = await fetchHttpClient.put<DetailApiResponse<MyWallet>>(
      WALLET_ENDPOINTS.DEBIT,
      data
    );
    return response;
  },
  getAllWalletUser: async ({
    page,
    limit,
  }: { page?: number; limit?: number } = {}): Promise<
    AxiosResponse<ApiResponse<Wallet[]>>
  > => {
    const response = await fetchHttpClient.get<ApiResponse<Wallet[]>>(
      WALLET_ENDPOINTS.GET_ALL_WALLET_USER,

      {
        page,
        limit,
      }
    );
    return response;
  },
  getManageTransactions: async ({
    page,
    limit,
  }: { page?: number; limit?: number } = {}): Promise<
    AxiosResponse<ApiResponse<ManageTransactionsResponse[]>>
  > => {
    const response = await fetchHttpClient.get<
      ApiResponse<ManageTransactionsResponse[]>
    >(WALLET_ENDPOINTS.MANAGE_TRANSACTIONS, {
      page,
      limit,
    });
    return response;
  },
  getWalletOverview: async (): Promise<
    AxiosResponse<DetailApiResponse<WalletOverview>>
  > => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<WalletOverview>
    >(WALLET_ENDPOINTS.OVERVIEW);
    return response;
  },
  getDetailWallet: async ({
    user_id,
  }: {
    user_id: string;
  }): Promise<AxiosResponse<ApiResponse<DetailWallet[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<DetailWallet[]>>(
      `${WALLET_ENDPOINTS.DETAIL_WALLET(user_id)}`
    );
    return response;
  },
  updateStatusWallet: async (
    id: string,
    newStatus: "ĐANG HOẠT ĐỘNG" | "ĐÃ BỊ ĐÓNG BĂNG"
  ): Promise<AxiosResponse<DetailApiResponse<UpdateWalletStatusResponse>>> => {
    const response = await fetchHttpClient.patch<
      DetailApiResponse<UpdateWalletStatusResponse>
    >(WALLET_ENDPOINTS.UPDATE_STATUS(id), { newStatus });
    return response;
  },
}; 
