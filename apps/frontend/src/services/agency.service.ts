import fetchHttpClient from "@/lib/httpClient";
import { ENDPOINT } from "@/constants";
import { AxiosResponse } from "axios";
import { ApiResponse } from "@/types";
import type { Agency } from "@/types/Agency";
export const agencyService = {
  getAgencies: async ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }) : Promise<AxiosResponse<ApiResponse<Agency[]>>>=> {
    const response = fetchHttpClient.get<ApiResponse<Agency[]>>(ENDPOINT.AGENCY.BASE, {
      page: page,
      pageSize: pageSize,
    });
    return response;
  },
  getDetailAgency : async({id}:{id : string}) : Promise<AxiosResponse<Agency>> => {
    const response = fetchHttpClient.get<Agency>(ENDPOINT.AGENCY.ID(id));
    return response;
  },
};
