import { presentWalletError } from "@/presenters/wallets/wallet-error-presenter";
import { walletServiceV1 } from "@services/wallets/wallet.service";
import { useInfiniteQuery } from "@tanstack/react-query";

import { walletQueryKeys } from "./wallet-query-keys";

export async function fetchMyTransactions(page: number = 1, limit: number = 5) {
  const result = await walletServiceV1.listMyWalletTransactions({ page, pageSize: limit });
  if (result.ok) {
    return result.value;
  }
  throw new Error(presentWalletError(result.error));
}
export function useGetMyTransactionsQuery(limit: number = 5, enabled: boolean = true, scope: string | null | undefined) {
  return useInfiniteQuery({
    queryKey: walletQueryKeys.myTransactions(scope),
    queryFn: ({ pageParam = 1 }) => fetchMyTransactions(pageParam, limit),
    enabled,
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
