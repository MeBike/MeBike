import fetchHttpClient from "@/lib/httpClient";
import type { SOS } from "@custom-types";
import type { AxiosResponse } from "axios";
import type { AssignSOSSchema, ResolveSOSSchema } from "@/schemas/sosSchema";
import type {
  DetailApiResponse,
  ApiResponse,
  IBikeIssueReport,
} from "@custom-types";
interface ConfirmSOS {
  message: string;
  newStatus : string;
}
interface RentalBySOSID {
  _id: string;
  user_id: string;
  bike_id: string;
  start_station: string;
  start_time : string;
  duration : number;
  total_price : number;
  status : string;
  created_at : string;
  updated_at : string;
}
const SOS_BASE = "/sos";
const SOS_ENDPOINTS = {
  BASE: SOS_BASE,
  ID: (id: string) => `${SOS_BASE}/${id}`,
  ASSIGN: (id: string) => `${SOS_BASE}/${id}/assign`,
  CONFIRM: (id: string) => `${SOS_BASE}/${id}/confirm`,
  RESOLVE: (id: string) => `${SOS_BASE}/${id}/resolve`,
  CREATE: (id:string) => `/rentals/sos/${id}`,
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
  //sos agent
  confirmSOSRequest: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<ConfirmSOS>>> => {
    const response = await fetchHttpClient.post<DetailApiResponse<ConfirmSOS>>(
      SOS_ENDPOINTS.CONFIRM(id)
    );
    return response;
  },
  resolveSOSRequest: async ({
    id,
    data,
  }: {
    id: string;
    data: ResolveSOSSchema;
  }): Promise<AxiosResponse<DetailApiResponse<ConfirmSOS>>> => {
    const response = await fetchHttpClient.post<DetailApiResponse<ConfirmSOS>>(
      SOS_ENDPOINTS.RESOLVE(id),
      data
    );
    return response;
  },
  createNewRentalSOS: async (
    id: string
  ): Promise<AxiosResponse<DetailApiResponse<RentalBySOSID>>> => {
    const response = await fetchHttpClient.post<DetailApiResponse<RentalBySOSID>>(
      SOS_ENDPOINTS.CREATE(id)
    );
    return response;
  },

};
