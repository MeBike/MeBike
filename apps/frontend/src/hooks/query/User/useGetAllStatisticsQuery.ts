import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
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
    queryKey: ["user", "statistics"],
    queryFn: () => fetchUserStatistics(),
  });
};
