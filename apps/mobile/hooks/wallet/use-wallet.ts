import { WALLET_CONSTANTS } from "../../utils/wallet/constants";
import { useWithdrawalAction } from "../use-withdrawal-action";
import { useRefundAction } from "../useRefundAction";
import { useWalletActions } from "../useWalletAction";

export function useWallet() {
  const limit = WALLET_CONSTANTS.DEFAULT_LIMIT;

  const wallet = useWalletActions(true, limit);
  const withdrawals = useWithdrawalAction();
  const refunds = useRefundAction();

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

    // Withdrawals
    withdrawalRequests: withdrawals.withdrawalRequests,
    isLoadingWithdrawals: withdrawals.isLoadingWithdrawals,
    hasNextPageWithdrawals: withdrawals.hasNextPage,
    isFetchingNextPageWithdrawals: withdrawals.isFetchingNextPage,
    totalWithdrawals: withdrawals.totalWithdrawals,
    loadMoreWithdrawals: withdrawals.loadMore,

    // Refunds
    refundRequests: refunds.refundRequests,
    isLoadingRefunds: refunds.isLoadingRefunds,
    hasNextPageRefunds: refunds.hasNextPage,
    isFetchingNextPageRefunds: refunds.isFetchingNextPage,
    totalRefunds: refunds.totalRefunds,
    loadMoreRefunds: refunds.loadMore,

    // Actions
    getMyWallet: wallet.getMyWallet,
    getMyTransaction: wallet.getMyTransaction,
    getMyWithdrawals: withdrawals.refetchWithdrawals,
    createWithdrawal: withdrawals.createWithdrawal,
    isCreatingWithdrawal: withdrawals.isCreating,
    createRefund: refunds.createRefund,
    isCreatingRefund: refunds.isCreating,

    createPayment : wallet.createPayment,
  };
}
