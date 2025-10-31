import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";

const fetchTopRenter = async () => {
  try {
    const response = await userService.getTopRenter();
    if (response.status === 200) {
      console.log(response);
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const useGetTopRenterQuery = () => {
  return useQuery({
    queryKey: ["user", "top-renter"],
    queryFn: () => fetchTopRenter(),
    enabled: true,
  });
};