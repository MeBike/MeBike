import fetchHttpClient from "@/lib/httpClient";
import { ENDPOINT } from "@/constants";
import { AxiosResponse } from "axios";
import { ApiResponse } from "@/types";
import type { AssetNFCCard, AssetStatus } from "@/types";
export const nfcService = {
  getListNFC: async ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<ApiResponse<AssetNFCCard[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<AssetNFCCard[]>>(
      ENDPOINT.NFC.BASE,
      {
        page: page,
        pageSize: pageSize,
      },
    );
    return response;
  },
  getListNFCDetail: async ({
    nfcId,
  }: {
    nfcId: string;
  }): Promise<AxiosResponse<AssetNFCCard>> => {
    const response = await fetchHttpClient.get<AssetNFCCard>(
      ENDPOINT.NFC.ID(nfcId),
    );
    return response;
  },
  createNFC: async ({
    data,
  }: {
    data: { uid: string };
  }): Promise<AxiosResponse<AssetNFCCard>> => {
    const response = await fetchHttpClient.post<AssetNFCCard>(
      ENDPOINT.NFC.BASE,
      data,
    );
    return response;
  },
  assignNFC: async ({
    nfcId,
    userId,
  }: {
    nfcId: string;
    userId: string;
  }): Promise<AxiosResponse<AssetNFCCard>> => {
    const response = await fetchHttpClient.patch<AssetNFCCard>(
      ENDPOINT.NFC.ASSIGN(nfcId),
      {
        userId: userId,
      },
    );
    return response;
  },
  unassignNFC: async ({
    nfcId,
    userId,
  }: {
    nfcId: string;
    userId: string;
  }): Promise<AxiosResponse<AssetNFCCard>> => {
    const response = await fetchHttpClient.patch<AssetNFCCard>(
      ENDPOINT.NFC.UNASSIGN(nfcId),
      {
        userId: userId,
      },
    );
    return response;
  },
  updateCardStatus: async ({
    nfcId,
    data,
  }: {
    nfcId: string;
    data: {
      status: AssetStatus;
    };
  }): Promise<AxiosResponse<AssetNFCCard>> => {
    const response = await fetchHttpClient.patch<AssetNFCCard>(
      ENDPOINT.NFC.STATUS(nfcId),
      data,
    );
    return response;
  },
};
