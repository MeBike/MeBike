import fetchHttpClient from "@/lib/httpClient";
import { ENDPOINT } from "@/constants";
import { AxiosResponse } from "axios";
import { ApiResponse } from "@/types";
import { type Environment } from "@/types/Environment";
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
};
