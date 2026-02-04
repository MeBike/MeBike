import type { WalletTransactionDetail } from "@services/wallets/wallet.service";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { useGetMyTransactionsQuery } from "./query/Wallet/useGetMyTransactionQuery";
import { useGetMyWalletQuery } from "./query/Wallet/useGetMyWalletQuery";

type ErrorResponse = {
  response?: {
    data?: {
      errors?: Record<string, { msg?: string }>;
      message?: string;
    };
  };
};

type ErrorWithMessage = {
  message: string;
};

export function useWalletActions(hasToken: boolean, limit: number = 5) {
  const queryClient = useQueryClient();
  const useGetMyWallet = useGetMyWalletQuery();
  const useGetMyTransaction = useGetMyTransactionsQuery(limit);
  const { refetch, data: response, isLoading } = useGetMyWallet;
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
    return await useGetMyTransaction.refetch();
  }, [useGetMyTransaction, hasToken]);
  const loadMoreTransactions = () => {
    if (useGetMyTransaction.hasNextPage && !useGetMyTransaction.isFetchingNextPage) {
      useGetMyTransaction.fetchNextPage();
    }
  };
  const transactions = useMemo(() => {
    const pages = useGetMyTransaction.data?.pages ?? [];
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
  }, [useGetMyTransaction.data]);
  const totalTransactions = useGetMyTransaction.data?.pages[0]?.pagination?.total || 0;
  return {
    getMyWallet,
    myWallet: response,
    isLoadingGetMyWallet: isLoading,
    getMyTransaction,
    myTransactions: transactions,
    isLoadingGetMyTransaction: useGetMyTransaction.isLoading,
    loadMoreTransactions,
    hasNextPageTransactions: useGetMyTransaction.hasNextPage,
    isFetchingNextPageTransactions: useGetMyTransaction.isFetchingNextPage,
    totalTransactions,
  };
}
