import type { WalletTransactionDetail } from "@services/wallets/wallet.service";

import { useCallback, useMemo } from "react";

import { useGetMyTransactionsQuery } from "./query/wallet/use-get-my-transaction-query";
import { useGetMyWalletQuery } from "./query/wallet/use-get-my-wallet-query";

export function useWalletActions(hasToken: boolean, limit: number = 5, scope: string | null | undefined = null) {
  const useGetMyWallet = useGetMyWalletQuery(hasToken, scope);
  const useGetMyTransaction = useGetMyTransactionsQuery(limit, hasToken, scope);
  const { refetch, data: response, isLoading } = useGetMyWallet;
  const {
    refetch: refetchTransactions,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    data: transactionsResponse,
    isLoading: isLoadingTransactions,
  } = useGetMyTransaction;

  const getMyWallet = useCallback(async () => {
    if (!hasToken) {
      return;
    }
    return await refetch();
  }, [refetch, hasToken]);

  const getMyTransaction = useCallback(async () => {
    if (!hasToken) {
      return;
    }
    return await refetchTransactions();
  }, [refetchTransactions, hasToken]);

  const loadMoreTransactions = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const transactions = useMemo(() => {
    const pages = transactionsResponse?.pages ?? [];
    const seen = new Set<string>();
    const deduped: WalletTransactionDetail[] = [];
    pages.forEach((page) => {
      page.data.forEach((transaction) => {
        if (!seen.has(transaction.id)) {
          seen.add(transaction.id);
          deduped.push(transaction);
        }
      });
    });
    return deduped;
  }, [transactionsResponse]);

  const totalTransactions = transactionsResponse?.pages[0]?.pagination?.total || 0;

  return {
    getMyWallet,
    myWallet: response,
    isLoadingGetMyWallet: isLoading,
    getMyTransaction,
    myTransactions: transactions,
    isLoadingGetMyTransaction: isLoadingTransactions,
    loadMoreTransactions,
    hasNextPageTransactions: hasNextPage,
    isFetchingNextPageTransactions: isFetchingNextPage,
    totalTransactions,
  };
}
