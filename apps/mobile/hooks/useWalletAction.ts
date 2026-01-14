import type { Transaction } from "@services/wallet.service";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { Alert, Linking } from "react-native";

import { useCreatePaymentMutation } from "./mutations/Wallet/useCreatePayment";
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
  const transactions = useMemo(() => {
    const pages = useGetMyTransaction.data?.pages ?? [];
    const seen = new Set<string>();
    const deduped: Transaction[] = [];
    pages.forEach((page) => {
      page.data.forEach((transaction) => {
        if (!seen.has(transaction._id)) {
          seen.add(transaction._id);
          deduped.push(transaction);
        }
      });
    });
    return deduped;
  }, [useGetMyTransaction.data]);
  const totalTransactions = useGetMyTransaction.data?.pages[0]?.pagination?.totalRecords || 0;
  const useCreatePayment = useCreatePaymentMutation();
  const createPayment = useCallback(
    async ({ accountId, amount }: { accountId: string; amount: number }) => {
      if (!hasToken) {
        return;
      }
      useCreatePayment.mutate({ accountId, amount }, {
        onSuccess: async (result: any) => {
          if (result.status === 200) {
            const paymentUrl = result.data?.data?.CreatePayment.data?.paymentUrl;
            if (paymentUrl) {
              await Linking.openURL(paymentUrl);
            }
            else {
              Alert.alert(result.data?.data?.CreatePayment.message || "Payment created successfully");
            }
            await queryClient.invalidateQueries({
              queryKey: ["my-wallet"],
            });
            await refetch();
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, "Failed to create payment");
          Alert.alert(errorMessage);
        },
      });
    },
    [hasToken, useCreatePayment],
  );
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
    createPayment,
  };
}
