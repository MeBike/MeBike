import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";
const fetchAllWalletUser = async (
  {page , limit} : {page?: number; limit?: number} 
) => {
  try {
    const response = await walletService.getAllWalletUser({page, limit});
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch all wallet users");
  }
};
export const useGetAllWalletQuery = ({page,limit} : {page?: number; limit?: number}) => {
  return useQuery({
    queryKey: ["all-wallet-users",  page, limit ],
    queryFn: () => fetchAllWalletUser({page, limit}),
  });
};