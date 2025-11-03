import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";

const fetchDetailWallet = async (user_id: string) => {
  try {
    const response = await walletService.getDetailWallet({ user_id });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch wallet details");
  }
};
export const useGetDetailWalletQuery = (user_id: string) => {
  return useQuery({
    queryKey: ["detail-wallet", user_id],
    queryFn: () => fetchDetailWallet(user_id),
    enabled: !!user_id,
  });
};
