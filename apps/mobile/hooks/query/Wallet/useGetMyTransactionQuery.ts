import { walletErrorMessage, walletServiceV1 } from "@services/wallets/wallet.service";
import { useInfiniteQuery } from "@tanstack/react-query";

export async function fetchMyTransactions(page: number = 1, limit: number = 5) {
  const result = await walletServiceV1.listMyWalletTransactions({ page, pageSize: limit });
  if (result.ok) {
    return result.value;
  }
  throw new Error(walletErrorMessage(result.error));
}
export function useGetMyTransactionsQuery(limit: number = 5) {
  return useInfiniteQuery({
    queryKey: ["myTransactions"],
    queryFn: ({ pageParam = 1 }) => fetchMyTransactions(pageParam, limit),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });
}
