import { useQuery } from "@tanstack/react-query";
import { walletService } from "@services/walletService";
import type { Transaction } from "@services/walletService";
export const fetchMyTransactions = async (): Promise<Transaction[]> => {
  const response = await walletService.transactions();
  if (response.status === 200) {
    return response.data.data ?? [];
  }
  throw new Error("Failed to fetch transactions");
};
export const useGetMyTransactionsQuery = () => {
    return useQuery({
      queryKey: ["myTransactions"],
      queryFn: () => fetchMyTransactions(),
      staleTime: 5 * 60 * 1000,
    });
}
