import { useMemo } from "react";

import { useWalletActions } from "@hooks/use-wallet-action";
import { useAuthNext } from "@providers/auth-provider-next";
import { WALLET_CONSTANTS } from "@utils/wallet/constants";

export function useMyWalletScreen() {
  const { isAuthenticated, user } = useAuthNext();
  const wallet = useWalletActions(isAuthenticated, WALLET_CONSTANTS.DEFAULT_LIMIT, user?.id);

  return useMemo(() => ({
    getMyTransaction: wallet.getMyTransaction,
    getMyWallet: wallet.getMyWallet,
    hasNextPageTransactions: wallet.hasNextPageTransactions,
    isFetchingNextPageTransactions: wallet.isFetchingNextPageTransactions,
    isLoadingTransactions: wallet.isLoadingGetMyTransaction,
    isLoadingWallet: wallet.isLoadingGetMyWallet,
    loadMoreTransactions: wallet.loadMoreTransactions,
    myWallet: wallet.myWallet,
    userId: user?.id ?? null,
    totalTransactions: wallet.totalTransactions,
    transactions: wallet.myTransactions,
  }), [
    wallet.getMyTransaction,
    wallet.getMyWallet,
    wallet.hasNextPageTransactions,
    wallet.isFetchingNextPageTransactions,
    wallet.isLoadingGetMyTransaction,
    wallet.isLoadingGetMyWallet,
    wallet.loadMoreTransactions,
    wallet.myTransactions,
    wallet.myWallet,
    wallet.totalTransactions,
    user?.id,
  ]);
}
