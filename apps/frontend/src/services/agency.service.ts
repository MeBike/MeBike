import fetchHttpClient from "@/lib/httpClient";
import { ENDPOINT } from "@/constants";
import { AxiosResponse } from "axios";
import { ApiResponse } from "@/types";
import type { Agency, AgencyStats, AgencyRequest } from "@/types/Agency";
import { UpdateAgencyFormData, UpdateAgencyStatusFormData , RegisterAgencyFormData , AdminCreateAgencyUserRequest } from "@/schemas";
export const agencyService = {
  getAgencies: async ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<ApiResponse<Agency[]>>> => {
    const response = fetchHttpClient.get<ApiResponse<Agency[]>>(
      ENDPOINT.AGENCY.BASE,
      {
        page: page,
        pageSize: pageSize,
      },
    );
    return response;
  },
  getDetailAgency: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<Agency>> => {
    const response = fetchHttpClient.get<Agency>(ENDPOINT.AGENCY.ID(id));
    return response;
  },
  getAgencyStats: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<AgencyStats>> => {
    const response = fetchHttpClient.get<AgencyStats>(
      ENDPOINT.AGENCY.STATS(id),
    );
    return response;
  },
  updateAgencyStatus: async ({
    id,
    data,
  }: {
    id: string;
    data: UpdateAgencyStatusFormData;
  }): Promise<AxiosResponse<Agency>> => {
    const response = fetchHttpClient.patch<Agency>(
      ENDPOINT.AGENCY.STATUS(id),
      data,
    );
    return response;
  },
  updateAgency: async ({
    id,
    data,
  }: {
    id: string;
    data: Partial<UpdateAgencyFormData>;
  }): Promise<AxiosResponse<Agency>> => {
    const response = fetchHttpClient.patch<Agency>(
      ENDPOINT.AGENCY.ID(id),
      data,
    );
    return response;
  },
  getAgencyRequest: async ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<ApiResponse<AgencyRequest[]>>> => {
    const response = fetchHttpClient.get<ApiResponse<AgencyRequest[]>>(
      ENDPOINT.AGENCY_REQUEST.BASE,
      {
        page: page,
        pageSize: pageSize,
      },
    );
    return response;
  },
  getAgencyRequestDetail: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<AgencyRequest>> => {
    const response = fetchHttpClient.get<AgencyRequest>(
      ENDPOINT.AGENCY_REQUEST.ID(id),
    );
    return response;
  },
  approveAgencyRequest: async ({
    id,
    description,
  }: {
    id: string;
    description?: string;
  }): Promise<AxiosResponse<AgencyRequest>> => {
    const response = await fetchHttpClient.post<AgencyRequest>(
      ENDPOINT.AGENCY_REQUEST.APPROVE(id),
      description ? { description } : {},
    );
    return response;
  },
  rejectAgencyRequest: async ({
    id,
    description,
    reason,
  }: {
    id: string;
    description?: string;
    reason?: string;
  }): Promise<AxiosResponse<AgencyRequest>> => {
    const payload = {
      ...(description && { description }),
      ...(reason && { reason }),
    };
    const response = await fetchHttpClient.post<AgencyRequest>(
      ENDPOINT.AGENCY_REQUEST.REJECT(id),
      payload,
    );
    return response;
  },
  cancelAgencyRequest: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<AgencyRequest>> => {
    const response = await fetchHttpClient.post<AgencyRequest>(
      ENDPOINT.AGENCY_REQUEST.CANCEL(id),
    );
    return response;
  },
  registerAgency : async({data}:{data:RegisterAgencyFormData}) : Promise<AxiosResponse<AgencyRequest>> => {
    const response = await fetchHttpClient.post<AgencyRequest>(ENDPOINT.AGENCY_REQUEST.CREATE,data);
    return response
  },
  adminCreateAgency : async({data}:{data:Partial<AdminCreateAgencyUserRequest>}) => {
    const response = await fetchHttpClient.post<Agency>(ENDPOINT.USER.CREATE_USER,data);
    return response
  }
};
