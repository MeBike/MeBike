import { useMemo } from "react";

import { useWalletActions } from "@hooks/use-wallet-action";
import { WALLET_CONSTANTS } from "@utils/wallet/constants";

export function useMyWalletScreen() {
  const wallet = useWalletActions(true, WALLET_CONSTANTS.DEFAULT_LIMIT);

  return useMemo(() => ({
    getMyTransaction: wallet.getMyTransaction,
    getMyWallet: wallet.getMyWallet,
    hasNextPageTransactions: wallet.hasNextPageTransactions,
    isFetchingNextPageTransactions: wallet.isFetchingNextPageTransactions,
    isLoadingTransactions: wallet.isLoadingGetMyTransaction,
    isLoadingWallet: wallet.isLoadingGetMyWallet,
    loadMoreTransactions: wallet.loadMoreTransactions,
    myWallet: wallet.myWallet,
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
  ]);
}
