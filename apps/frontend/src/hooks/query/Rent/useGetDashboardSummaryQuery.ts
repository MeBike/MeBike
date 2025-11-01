import { useQuery } from "@tanstack/react-query";
import { rentalService } from "@/services/rental.service";

const fetchDashboardSummary = async () => {
  try {
    const response = await rentalService.getDashboardRentalStats();
    if(response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    throw error;
  }
};

export const useGetDashboardSummaryQuery = () => {
  return useQuery({
    queryKey: ["dashboard-rental-summary"],
    queryFn: fetchDashboardSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};