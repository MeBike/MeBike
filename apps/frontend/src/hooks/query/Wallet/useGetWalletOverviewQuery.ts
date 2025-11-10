import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";
const fetchWalletOverview = async () => {
  try {
    const response = await walletService.getWalletOverview();
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const useGetWalletOverviewQuery = () => {
  return useQuery({
    queryKey: ["wallet-overview"],
    queryFn: fetchWalletOverview,
    enabled: false,
    staleTime: 5 * 60 * 1000,
  });
}