import fetchHttpClient from "@/lib/httpClient";
import type { SOS } from "@custom-types";
import type { AxiosResponse } from "axios";
import type { DetailApiResponse, ApiResponse } from "@custom-types";
const SOS_BASE = "/sos";
const SOS_ENDPOINTS = {
  BASE: SOS_BASE,
  CONFIRM: (id: string) => `${SOS_BASE}/${id}/confirm`,
  REJECT: (id: string) => `${SOS_BASE}/${id}/reject`,
  ID: (id: string) => `${SOS_BASE}/${id}`,
} as const;
export const sosService = {
  getSOSRequest: async (
    id: string
  ): Promise<AxiosResponse<ApiResponse<SOS[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<SOS[]>>(
      SOS_ENDPOINTS.ID(id)
    );
    return response;
  },
  postConfirmSOSRequest: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<DetailApiResponse<SOS>>> => {
    const response = await fetchHttpClient.post<DetailApiResponse<SOS>>(
      SOS_ENDPOINTS.CONFIRM(id)
    );
    return response;
  },
  postRejectSOSRequest: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<DetailApiResponse<SOS>>> => {
    const response = await fetchHttpClient.post<DetailApiResponse<SOS>>(
      SOS_ENDPOINTS.REJECT(id)
    );
    return response;
  },
  getDetailSOSRequest: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<SOS>>> => {
    const response = await fetchHttpClient.get<DetailApiResponse<SOS>>(
      SOS_ENDPOINTS.ID(id)
    );
    return response;
  },
};
