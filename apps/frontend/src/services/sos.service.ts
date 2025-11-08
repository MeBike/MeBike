import fetchHttpClient from "@/lib/httpClient";
import type { SOS } from "@custom-types";
import type { AxiosResponse } from "axios";
import type { CreateSOSSchema , ConfirmSOSSchema , RejectSOSSchema } from "@/schemas/sosSchema";
import type {
  DetailApiResponse,
  ApiResponse,
  IBikeIssueReport,
} from "@custom-types";
const SOS_BASE = "/sos";
const SOS_ENDPOINTS = {
  BASE: SOS_BASE,
  CONFIRM: (id: string) => `${SOS_BASE}/${id}/confirm`,
  REJECT: (id: string) => `${SOS_BASE}/${id}/reject`,
  ID: (id: string) => `${SOS_BASE}/${id}`,
} as const;
export const sosService = {
  getSOSRequest: async ({
    page,
    limit,
  }: {
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<SOS[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<SOS[]>>(
      SOS_ENDPOINTS.BASE,

      {
        page,
        limit,
      }
    );
    return response;
  },
  postConfirmSOSRequest: async ({
    id,
    data,
  }: {
    id: string;
    data: ConfirmSOSSchema; 
  }): Promise<AxiosResponse<DetailApiResponse<SOS>>> => {
    const response = await fetchHttpClient.post<DetailApiResponse<SOS>>(
      SOS_ENDPOINTS.CONFIRM(id),data
    );
    return response;
  },
  postRejectSOSRequest: async ({
    id,
    data,
  }: {
    id: string;
    data: RejectSOSSchema;
  }): Promise<AxiosResponse<DetailApiResponse<SOS>>> => {
    const response = await fetchHttpClient.post<DetailApiResponse<SOS>>(
      SOS_ENDPOINTS.REJECT(id),data
    );
    return response;
  },
  getDetailSOSRequest: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<IBikeIssueReport>>> => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<IBikeIssueReport>
    >(SOS_ENDPOINTS.ID(id));
    return response;
  },
  postCreateSOSRequest: async ( 
    data: CreateSOSSchema
  ): Promise<AxiosResponse<DetailApiResponse<SOS>>> => {
    const response = await fetchHttpClient.post<DetailApiResponse<SOS>>(
      SOS_ENDPOINTS.BASE,
      data
    );
    return response;
  },
};
