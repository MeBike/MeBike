import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import { get } from "http";
const getStatisticsBikeAdmin = async () => {
  try {
    const response = await bikeService.getStatisticsBikeAdmin();
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Error fetching bike statuses");
  }
};
export const useGetStatisticsBikeQuery = () => {
  return useQuery({
    queryKey: ["bikes", "status"],
    queryFn: () => getStatisticsBikeAdmin(),
    enabled: false,
  });
};
