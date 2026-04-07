import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import { Transaction, UserWallet, ApiResponse } from "@custom-types";
import { ENDPOINT } from "@/constants";

export const walletService = {
  getWalletUser: async ({
    page,
    pageSize,
    id,
  }: {
    page?: number;
    pageSize?: number;
    id: string;
  }): Promise<AxiosResponse<UserWallet>> => {
    const response = await fetchHttpClient.get<UserWallet>(
      ENDPOINT.WALLET.BASE(id),
      {
        page: page,
        pageSize: pageSize,
      },
    );
    return response;
  },
  getManageTransactions: async ({
    page,
    pageSize,
    id,
  }: {
    page?: number;
    pageSize?: number;
    id: string;
  }): Promise<AxiosResponse<ApiResponse<Transaction>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Transaction>>(
      ENDPOINT.WALLET.TRANSACTION(id),
      {
        page : page,
        pageSize : pageSize,
      },
    );
    return response;
  },
};
