import { withdrawalsService } from "@/services/withdrawal.service";
import { useQuery } from "@tanstack/react-query";

const getWithdrawalOverview = async () => {
  const response = await withdrawalsService.getOverview();
  return response.data.result;
}
export const useGetAllWithdrawalOverviewQuery = () => {
  return useQuery({
    queryKey: ["withdrawal-overview"],
    queryFn: getWithdrawalOverview,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}