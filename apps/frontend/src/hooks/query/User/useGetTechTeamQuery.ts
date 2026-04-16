import { useQuery } from "@tanstack/react-query";
import { userService } from "@services/user.service";
const fetchTechTeam = async ({}: {}) => {
  try {
    const response = await userService.getTechTeam();
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const useGetTechTeamQuery = ({}: {}) => {
  return useQuery({
    queryKey: ["tech", "team"],
    queryFn: () => fetchTechTeam({}),
    enabled: false,
  });
};
