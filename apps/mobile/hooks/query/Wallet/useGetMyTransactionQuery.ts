import { useInfiniteQuery } from "@tanstack/react-query";

import type { Transaction } from "@services/wallet.service";

import { walletService } from "@services/wallet.service";

export async function fetchMyTransactions(page: number = 1, limit: number = 5): Promise<{ data: Transaction[]; pagination: { totalPages: number; currentPage: number; limit: number; totalRecords: number } }> {
  const response = await walletService.transactions({ page, limit });
  if (response.status === 200) {
    return response.data as unknown as { data: Transaction[]; pagination: { totalPages: number; currentPage: number; limit: number; totalRecords: number } };
  }
  throw new Error("Failed to fetch transactions");
}
export function useGetMyTransactionsQuery(limit: number = 5) {
  return useInfiniteQuery({
    queryKey: ["myTransactions"],
    queryFn: ({ pageParam = 1 }) => fetchMyTransactions(pageParam, limit),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });
}
