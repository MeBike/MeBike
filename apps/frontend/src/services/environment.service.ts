import fetchHttpClient from "@/lib/httpClient";
import { ENDPOINT } from "@/constants";
import { AxiosResponse } from "axios";
import { ApiResponse } from "@/types";
import { type Environment, type Co2Record , type Co2RecordItem} from "@/types/Environment";
import { CreateEnvironmentPolicyInput } from "@/schemas/environment-policy-schema";
export const environmentService = {
  getEnvironmentPolices: async ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<ApiResponse<Environment[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Environment[]>>(
      ENDPOINT.ENVIRONMENT.POLICY,
      {
        page: page,
        pageSize: pageSize,
      },
    );
    return response;
  },
  getEnvironmentPolicesActive: async ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<ApiResponse<Environment[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Environment[]>>(
      ENDPOINT.ENVIRONMENT.ACTIVE,
      {
        page: page,
        pageSize: pageSize,
      },
    );
    return response;
  },
  createEnvironmentPolicy: async (
    data: CreateEnvironmentPolicyInput,
  ): Promise<AxiosResponse<Environment>> => {
    const response = await fetchHttpClient.post<Environment>(
      ENDPOINT.ENVIRONMENT.POLICY,
      data,
    );
    return response;
  },
  patchActiveEnvironmentPolicy: async (
    id: string,
  ): Promise<AxiosResponse<Environment>> => {
    const response = await fetchHttpClient.patch<Environment>(
      ENDPOINT.ENVIRONMENT.ACTIVE_ID(id),
    );
    return response;
  },
  getEnvironmentImpacts: async ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<ApiResponse<Co2RecordItem[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<Co2RecordItem[]>>(
      ENDPOINT.ENVIRONMENT.IMPACT,
      {
        page: page,
        pageSize: pageSize,
      },
    );
    return response;
  },
  getEnvironmentImpactDetail: async ({
    id,
  }: {
    id: string;
  }): Promise<AxiosResponse<Co2Record>> => {
    const response = await fetchHttpClient.get<Co2Record>(
      ENDPOINT.ENVIRONMENT.IMPACT_ID(id),
    );
    return response;
  },
};
