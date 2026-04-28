import { useQuery } from "@tanstack/react-query";
import { technicianService } from "@/services/technician.service";
import { HTTP_STATUS } from "@/constants";
const fetchTechnicianTeamStats = async ({page,pageSize,status}:{page?:number,pageSize?:number,status?:string}) => {
  try {
    const response = await technicianService.getAllTechnicianTeam({page : page, pageSize : pageSize,status : status});
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching supplier stats:", error);
    throw error;
  }
};
export const useGetAllTechnicianTeamQuery = ({page,pageSize,status}:{page?:number,pageSize?:number,status?:string}) => {
  return useQuery({
    queryKey: ["data", "technician-team",page,pageSize,status],
    queryFn: () => fetchTechnicianTeamStats({page,pageSize,status}),
    staleTime: 5 * 60 * 1000,
  });
};
