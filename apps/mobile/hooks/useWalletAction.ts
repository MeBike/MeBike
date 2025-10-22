import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useGetMyWalletQuery } from "./query/Wallet/useGetMyWalletQuery";
import { useGetMyTransactionsQuery } from "./query/Wallet/useGetMyTransactionQuery";
interface ErrorResponse {
  response?: {
    data?: {
      errors?: Record<string, { msg?: string }>;
      message?: string;
    };
  };
}

interface ErrorWithMessage {
  message: string;
}
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  const axiosError = error as ErrorResponse;
  if (axiosError?.response?.data) {
    const { errors, message } = axiosError.response.data;
    if (errors) {
      const firstError = Object.values(errors)[0];
      if (firstError?.msg) return firstError.msg;
    }
    if (message) return message;
  }
  const simpleError = error as ErrorWithMessage;
  if (simpleError?.message) {
    return simpleError.message;
  }

  return defaultMessage;
};
export const useWalletActions = (hasToken: boolean) => {
  const queryClient = useQueryClient();
  const useGetMyWallet = useGetMyWalletQuery();
  const useGetMyTransaction = useGetMyTransactionsQuery();
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
  return {
    getMyWallet,
    myWallet: response,
    isLoadingGetMyWallet: isLoading,
    getMyTransaction,
    myTransactions: useGetMyTransaction.data ?? [],
    isLoadingGetMyTransaction: useGetMyTransaction.isLoading,
  };
};
