import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

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
function getErrorMessage(error: unknown, defaultMessage: string): string {
  const axiosError = error as ErrorResponse;
  if (axiosError?.response?.data) {
    const { errors, message } = axiosError.response.data;
    if (errors) {
      const firstError = Object.values(errors)[0];
      if (firstError?.msg)
        return firstError.msg;
    }
    if (message)
      return message;
  }
  const simpleError = error as ErrorWithMessage;
  if (simpleError?.message) {
    return simpleError.message;
  }

  return defaultMessage;
}
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
  const transactions = useGetMyTransaction.data?.pages.flatMap(page => page.data) || [];
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
  };
}
