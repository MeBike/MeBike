import { useCallback } from "react";
import { useGetAllWalletQuery } from "./query/Wallet/useGetAllWalletQuery";
import { useGetManageTransactionQuery } from "@queries";

export function useWalletActions({
  hasToken,
  page,
  pageSize,
  userId,
  walletPage,
  walletPageSize,
  transactionPage,
  transactionPageSize,
}: {
  hasToken: boolean;
  page?: number;
  pageSize?: number;
  userId: string;
  /** When set, used for the user wallet query instead of `page` / `pageSize`. */
  walletPage?: number;
  walletPageSize?: number;
  /** When set, used for manage-transactions instead of `page` / `pageSize`. */
  transactionPage?: number;
  transactionPageSize?: number;
}) {
  const wPage = walletPage ?? page;
  const wSize = walletPageSize ?? pageSize;
  const tPage = transactionPage ?? page ?? 1;
  const tSize = transactionPageSize ?? pageSize ?? 10;
  const {
    data: allWallets,
    refetch: isRefetchingAllWallets,
    isLoading: isLoadingWallet,
  } = useGetAllWalletQuery({ page: wPage, pageSize: wSize, id: userId });
  const {
    data: manageTransactions,
    refetch: isRefetchingTransactions,
    isLoading: isLoadingTransactions,
  } = useGetManageTransactionQuery({
    page: tPage,
    pageSize: tSize,
    id: userId,
  });
  const getAllWalletUser = useCallback(async () => {
    if (!hasToken) {
      return;
    }
    isRefetchingAllWallets();
  }, [isRefetchingAllWallets, hasToken]);
  return {
    allWallets: allWallets,
    getAllWalletUser,
    manageTransactions,
    isRefetchingAllWallets,
    isLoadingTransactions,
    isLoadingWallet,
    isRefetchingTransactions,
  };
}
