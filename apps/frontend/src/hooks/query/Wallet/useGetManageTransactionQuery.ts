import { useQuery } from "@tanstack/react-query";
import { walletService } from "@services/wallet.service";
import { QUERY_KEYS } from "@constants/queryKey";
const fetchManageTransactions = async ({
  page,
  limit,
}: { page?: number; limit?: number }) => {
  try {
    const response = await walletService.getManageTransactions({ page, limit });
    if(response.status === 200){
        return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch manage transactions");
  }
};
export const useGetManageTransactionQuery = ({
  page,
  limit,
}: { page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.WALLET.MANAGE_TRANSACTIONS(page, limit),
    queryFn: () => fetchManageTransactions({ page, limit }),
  });
};
