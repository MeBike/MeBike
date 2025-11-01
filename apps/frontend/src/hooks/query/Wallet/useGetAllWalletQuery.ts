import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";
const fetchAllWalletUser = async () => {
  try {
    const response = await walletService.getAllWalletUser();
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch all wallet users");
  }
};
export const useGetAllWalletQuery = () => {
  return useQuery({
    queryKey: ["all-wallet-users"],
    queryFn: fetchAllWalletUser,
  });
};