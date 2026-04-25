import { useQuery } from "@tanstack/react-query";
import { technicianService } from "@/services/technician.service";
import { HTTP_STATUS } from "@/constants";
const fetchTechnicianTeamStats = async () => {
  try {
    const response = await technicianService.getAllTechnicianTeam();
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching supplier stats:", error);
    throw error;
  }
};
export const useGetAllTechnicianTeamQuery = () => {
  return useQuery({
    queryKey: ["data", "technician-team"],
    queryFn: fetchTechnicianTeamStats,
    staleTime: 5 * 60 * 1000,
  });
};
