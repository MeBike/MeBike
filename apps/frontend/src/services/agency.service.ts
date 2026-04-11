import fetchHttpClient from "@/lib/httpClient";
import { ENDPOINT } from "@/constants";
import { AxiosResponse } from "axios";
import { ApiResponse } from "@/types";
import type { Agency , AgencyStats } from "@/types/Agency";
import { UpdateAgencyFormData , UpdateAgencyStatusFormData } from "@/schemas";
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
  getAgencyStats : async({id}:{id:string}) : Promise<AxiosResponse<AgencyStats>> => {
    const response = fetchHttpClient.get<AgencyStats>(ENDPOINT.AGENCY.STATS(id));
    return response;
  },
  updateAgencyStatus : async({id , data }:{id:string , data : UpdateAgencyStatusFormData}) : Promise<AxiosResponse<Agency>> => {
    const response  = fetchHttpClient.patch<Agency>(ENDPOINT.AGENCY.STATUS(id),data);
    return response
  },
  updateAgency : async({id , data }:{id:string , data : Partial<UpdateAgencyFormData>}) : Promise<AxiosResponse<Agency>> => {
    const response  = fetchHttpClient.patch<Agency>(ENDPOINT.AGENCY.ID(id),data);
    return response
  },
};
