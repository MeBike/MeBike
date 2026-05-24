import fetchHttpClient from "@/lib/httpClient";
import { ENDPOINT } from "@/constants";
import { AxiosResponse } from "axios";
import { ApiResponse } from "@/types";
import { SystemConfig } from "@/types/SystemConfig";
export const configService = {
  getAllSystemConfigs: async (): Promise<
    AxiosResponse<SystemConfig[]>
  > => {
    const response = await fetchHttpClient.get<SystemConfig[]>(
      ENDPOINT.CONFIG.BASE,
    );
    return response;
  },
  updateSystemConfig: async (
    key: string,
    data: { value : string},
  ): Promise<AxiosResponse<SystemConfig>> => {
    const response = await fetchHttpClient.put<SystemConfig>(
      ENDPOINT.CONFIG.UPDATE(key),
      data,
    );
    return response;
  },
};
