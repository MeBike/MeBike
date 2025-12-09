import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { QUERY_KEYS } from "@/constants/queryKey";
const fetchNewRegistrationStats = async () => {
  try {
    const response = await userService.getNewRegistrationStats();
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const useGetNewRegistrationStatsQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.USER.NEW_REGISTRATION_STATS,
    queryFn: () => fetchNewRegistrationStats(),
    enabled: false,
  });
};