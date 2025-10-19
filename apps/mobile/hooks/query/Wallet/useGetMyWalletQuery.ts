import { useQuery } from "@tanstack/react-query";
import { walletService } from "@services/walletService";
import type { MyWallet } from "@services/walletService";
export const fetchMyWallet = async (): Promise<MyWallet> => {
  const response = await walletService.getMyWallet();
  if(response.status === 200){
    return response.data.result as MyWallet;
  }
  throw new Error("Failed to fetch user profile");
}
export const useGetMyWalletQuery = () => {
    return useQuery({
      queryKey: ["my-wallet"],
      queryFn: () => fetchMyWallet(),
      staleTime: 5 * 60 * 1000,
    });
}
