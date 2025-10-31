import { useQuery } from "@tanstack/react-query";
import { rentalService } from "@services/rental.service";
const getRevenue = async () => {
  try {
    const response = await rentalService.getRevenue();
    if(response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    throw error;
  }
}
export const useGetRevenueQuery = () => {
  return useQuery({
    queryKey: ["revenueStats"],
    queryFn: getRevenue,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}