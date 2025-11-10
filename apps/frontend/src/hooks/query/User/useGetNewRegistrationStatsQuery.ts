import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";

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
    queryKey: ["user", "new-registration-stats"],
    queryFn: () => fetchNewRegistrationStats(),
    enabled: false,
  });
};