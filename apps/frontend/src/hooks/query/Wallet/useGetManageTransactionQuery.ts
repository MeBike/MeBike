import { useQuery } from "@tanstack/react-query";
import { walletService } from "@services/wallet.service";
import { QUERY_KEYS } from "@constants/queryKey";
const fetchManageTransactions = async ({
  page,
  pageSize,
  id,
}: {
  page?: number;
  pageSize?: number;
  id: string;
}) => {
  try {
    const response = await walletService.getManageTransactions({
      page,
      pageSize,
      id,
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch manage transactions");
  }
};
export const useGetManageTransactionQuery = ({
  page,
  pageSize,
  id,
}: {
  page?: number;
  pageSize?: number;
  id: string;
}) => {
  return useQuery({
    queryKey: QUERY_KEYS.WALLET.MANAGE_TRANSACTIONS(id, page, pageSize),
    queryFn: () => fetchManageTransactions({ page, pageSize, id }),
    enabled: Boolean(id),
  });
};
