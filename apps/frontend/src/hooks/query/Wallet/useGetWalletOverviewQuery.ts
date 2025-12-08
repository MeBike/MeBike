import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";
import { QUERY_KEYS } from "@/constants/queryKey";
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
    queryKey: QUERY_KEYS.WALLET.WALLET_OVERVIEW,
    queryFn: fetchWalletOverview,
    enabled: false,
    staleTime: 5 * 60 * 1000,
  });
}