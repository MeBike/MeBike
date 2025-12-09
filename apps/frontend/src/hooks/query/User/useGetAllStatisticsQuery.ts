import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { QUERY_KEYS } from "@constants/queryKey";
const fetchUserStatistics = async () => {
  try {
    const response = await userService.userStatistics();
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const useGetAllStatisticsUserQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.USER.STATISTICS,
    queryFn: () => fetchUserStatistics(),
    enabled: false,
  });
};
