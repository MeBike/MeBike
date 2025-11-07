import { userService } from "@/services/user.service";
import { useQuery } from "@tanstack/react-query";
const fetchDashboardUserStats = async () => {
  try { 
    const response = await userService.getDashboardUserStats();
    if (response.status === 200) {
        return response.data;
    }
  } catch (error) {
    console.log(error);
    throw error;
  } 
};
export const useGetDashboardStatsQuery = () => {
  return useQuery({
    queryKey: ["user", "dashboard-stats"],
    queryFn: () => fetchDashboardUserStats(),
  });
};