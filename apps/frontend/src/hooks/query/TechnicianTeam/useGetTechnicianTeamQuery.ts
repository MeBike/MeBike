import { useQuery } from "@tanstack/react-query";
import { technicianService } from "@/services/technician.service";
import { HTTP_STATUS } from "@/constants";
const fetchTechnicianTeamStats = async ({page,pageSize,status,stationId}:{page?:number,pageSize?:number,status?:string,stationId?:string}) => {
  try {
     const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if (stationId) query.stationId = stationId;
    if (status) query.status = status;
    const response = await technicianService.getAllTechnicianTeam(query);
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching supplier stats:", error);
    throw error;
  }
};
export const useGetAllTechnicianTeamQuery = ({page,pageSize,status,stationId}:{page?:number,pageSize?:number,status?:string,stationId?:string}) => {
  return useQuery({
    queryKey: ["data", "technician-team",page,pageSize,status,stationId],
    queryFn: () => fetchTechnicianTeamStats({page,pageSize,status,stationId}),
    staleTime: 5 * 60 * 1000,
  });
};
