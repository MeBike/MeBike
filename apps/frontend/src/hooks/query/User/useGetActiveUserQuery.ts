import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";

const fetchActiveUser = async () => {
  try {
    const response = await userService.getActiveUser();
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const useGetActiveUserQuery = () => {
  return useQuery({
    queryKey: ["user", "active"],
    queryFn: () => fetchActiveUser(),
  });
};