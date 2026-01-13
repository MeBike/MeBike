import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import { GET_ALL_WALLET, UPDATE_STATUS_WALLET } from "@graphql";
import { print } from "graphql";
import type {
  TopUpSchemaFormData,
  DecreaseSchemaFormData,
} from "@/schemas/walletSchema";
import { GetAllWalletResponse, UpdateWalletStatusResponse } from "@/types/wallet";
import { ApiResponse, DetailApiResponse } from "@/types/Response";

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
    search,
  }: { page?: number; limit?: number; search?: string } = {}): Promise<
    AxiosResponse<GetAllWalletResponse>
  > => {
    const response = await fetchHttpClient.query<GetAllWalletResponse>(
      print(GET_ALL_WALLET),
      {
        params: {
          limit: limit,
          page: page,
          search: search,
        },
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
  // getWalletOverview: async (): Promise<
  //   AxiosResponse<DetailApiResponse<WalletOverview>>
  // > => {
  //   const response = await fetchHttpClient.get<
  //     DetailApiResponse<WalletOverview>
  //   >(WALLET_ENDPOINTS.OVERVIEW);
  //   return response;
  // },
  // getDetailWallet: async ({
  //   user_id,
  // }: {
  //   user_id: string;
  // }): Promise<AxiosResponse<ApiResponse<DetailWallet[]>>> => {
  //   const response = await fetchHttpClient.get<ApiResponse<DetailWallet[]>>(
  //     `${WALLET_ENDPOINTS.DETAIL_WALLET(user_id)}` ,
  //     {
  //       page : 1,
  //       limit : 100
  //     }
  //   );
  //   return response;
  // },
  updateWalletStatus: async (
    id: string,
    newStatus: "ACTIVE" | "BLOCKED"
  ): Promise<AxiosResponse<UpdateWalletStatusResponse>> => {
    const response = await fetchHttpClient.mutation<UpdateWalletStatusResponse>(
      print(UPDATE_STATUS_WALLET),
      {
        body: {
          id: id,
          status: newStatus,
        },
      }
    );
    return response;
  },
};
