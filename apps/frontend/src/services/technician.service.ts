import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import { ApiResponse , TechnicianTeamRecord  } from "@custom-types";
import { ENDPOINT } from "@/constants/end-point";
import type { CreateTechnicianTeamSchema , UpdateTechnicianTeamSchema } from "@/schemas/technician-schema";
export const technicianService = {
  getAllTechnicianTeam: async ({page,pageSize,status}:{page?:number,pageSize?:number,status?:string}): Promise<AxiosResponse<ApiResponse<TechnicianTeamRecord[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<TechnicianTeamRecord[]>>(
      ENDPOINT.TECH_TEAM.BASE,
      {
        page : page,
        pageSize : pageSize,
        status : status,
      }
    );
    return response;
  },
  updateTechnicianTeam : async (teamId : string, data : UpdateTechnicianTeamSchema) : Promise<AxiosResponse<TechnicianTeamRecord>> => {
    const response = await fetchHttpClient.patch<TechnicianTeamRecord>(
      ENDPOINT.TECH_TEAM.UPDATE(teamId),
      data,
    );
    return response;
  },
  getTechnicianTeamDetail : async (teamId : string) : Promise<AxiosResponse<TechnicianTeamRecord>> => {
    const response = await fetchHttpClient.get<TechnicianTeamRecord>(
      ENDPOINT.TECH_TEAM.UPDATE(teamId),
    );
    return response;
  },
  createTechnicianTeam : async (data : CreateTechnicianTeamSchema) : Promise<AxiosResponse<TechnicianTeamRecord>> => {
    const response = await fetchHttpClient.post<TechnicianTeamRecord>(
      ENDPOINT.TECH_TEAM.BASE,
      data,
    );
    return response;
  },
};
