import { useQuery } from "@tanstack/react-query";
import { technicianService } from "@/services/technician.service";
import { HTTP_STATUS } from "@/constants";
const fetchTechnicianTeamDetail = async (teamId : string) => {
  try {
    const response = await technicianService.getTechnicianTeamDetail(teamId);
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching supplier stats:", error);
    throw error;
  }
};
export const useGetTechnicianTeamDetailQuery = (teamId : string) => {
  return useQuery({
    queryKey: ["data", "technician-team-detail" , teamId],
    queryFn: () => fetchTechnicianTeamDetail(teamId),
    enabled:false,
  });
};
