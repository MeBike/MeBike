import { WALLET_CONSTANTS } from "../../utils/wallet/constants";
import { useWalletActions } from "../useWalletAction";

export function useWallet() {
  const limit = WALLET_CONSTANTS.DEFAULT_LIMIT;

  const wallet = useWalletActions(true, limit);
  return {
    // Wallet data
    myWallet: wallet.myWallet,
    isLoadingWallet: wallet.isLoadingGetMyWallet,

    // Transactions
    transactions: wallet.myTransactions,
    isLoadingTransactions: wallet.isLoadingGetMyTransaction,
    hasNextPageTransactions: wallet.hasNextPageTransactions,
    isFetchingNextPageTransactions: wallet.isFetchingNextPageTransactions,
    totalTransactions: wallet.totalTransactions,
    loadMoreTransactions: wallet.loadMoreTransactions,

    // Actions
    getMyWallet: wallet.getMyWallet,
    getMyTransaction: wallet.getMyTransaction,
  };
}
