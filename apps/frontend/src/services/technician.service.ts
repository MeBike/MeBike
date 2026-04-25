import fetchHttpClient from "@/lib/httpClient";
import type { AxiosResponse } from "axios";
import { ApiResponse , TechnicianTeamRecord  } from "@custom-types";
import { ENDPOINT } from "@/constants/end-point";
import type { CreateTechnicianTeamSchema , UpdateTechnicianTeamSchema } from "@/schemas/technician-schema";
export const technicianService = {
  getAllTechnicianTeam: async (): Promise<AxiosResponse<ApiResponse<TechnicianTeamRecord[]>>> => {
    const response = await fetchHttpClient.get<ApiResponse<TechnicianTeamRecord[]>>(
      ENDPOINT.TECH_TEAM.BASE,
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
  createTechnicianTeam : async (data : CreateTechnicianTeamSchema) : Promise<AxiosResponse<TechnicianTeamRecord>> => {
    const response = await fetchHttpClient.post<TechnicianTeamRecord>(
      ENDPOINT.TECH_TEAM.BASE,
      data,
    );
    return response;
  },
};
