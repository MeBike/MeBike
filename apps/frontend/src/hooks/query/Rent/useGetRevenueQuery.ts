import { useQuery } from "@tanstack/react-query";
import { rentalService } from "@services/rental.service";
const getRevenue = async ({
  from,
  to,
  groupBy,
} : {
  from?: string;
  to?: string;
  groupBy?: "MONTH" | "YEAR" | "DAY";
}) => {
  try {
    const response = await rentalService.getRevenue({
      from,
      to,
      groupBy,
    });
    if (response.status === 200) {
      return response.data.result;
    }
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    throw error;
  }
}
export const useGetRevenueQuery = (
  { from, to, groupBy }: {
    from?: string;
    to?: string;
    groupBy?: "MONTH" | "YEAR" | "DAY";
  }
) => {
  return useQuery({
    queryKey: ["revenueStats",  from, to, groupBy ],
    queryFn: () => getRevenue({ from, to, groupBy }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: false,
  });
}