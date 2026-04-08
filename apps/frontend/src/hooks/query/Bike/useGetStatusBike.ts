import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
const getStatusCount = async () => {
  try {
    const response = await bikeService.getStatusCountBikeAdmin();
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Error fetching bike statuses");
  }
};
export const useGetStatusCountQuery = () => {
  return useQuery({
    queryKey: ["bikes", "status"],
    queryFn: () => getStatusCount(),
    enabled: false,
  });
};
