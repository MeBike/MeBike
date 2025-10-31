import { useQuery } from "@tanstack/react-query";

import type { Transaction } from "@services/wallet.service";

import { walletService } from "@services/wallet.service";

export async function fetchMyTransactions(): Promise<Transaction[]> {
  const response = await walletService.transactions();
  if (response.status === 200) {
    return response.data.data ?? [];
  }
  throw new Error("Failed to fetch transactions");
}
export function useGetMyTransactionsQuery() {
  return useQuery({
    queryKey: ["myTransactions"],
    queryFn: () => fetchMyTransactions(),
    staleTime: 5 * 60 * 1000,
  });
}
