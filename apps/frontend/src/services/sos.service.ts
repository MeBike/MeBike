import fetchHttpClient from "@/lib/httpClient";
import type { SOS } from "@custom-types";
import type { AxiosResponse } from "axios";
import type { AssignSOSSchema } from "@/schemas/sosSchema";
import type {
  DetailApiResponse,
  ApiResponse,
  IBikeIssueReport,
} from "@custom-types";
import { assign } from "nodemailer/lib/shared";
const SOS_BASE = "/sos";
const SOS_ENDPOINTS = {
  BASE: SOS_BASE,
  ID: (id: string) => `${SOS_BASE}/${id}`,
  ASSIGN: (id: string) => `${SOS_BASE}/${id}/assign`,
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
  getDetailSOSRequest: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<IBikeIssueReport>>> => {
    const response = await fetchHttpClient.get<
      DetailApiResponse<IBikeIssueReport>
    >(SOS_ENDPOINTS.ID(id));
    return response;
  },
  assignSOSRequest: async (
    id: string,
    data: AssignSOSSchema
  ): Promise<AxiosResponse<DetailApiResponse<IBikeIssueReport>>> => {
    const response = await fetchHttpClient.post<
      DetailApiResponse<IBikeIssueReport>
    >(SOS_ENDPOINTS.ASSIGN(id), data);
    return response;
  },
};
