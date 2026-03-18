import {
  createStripeTopupPaymentSheetRoute,
  createStripeTopupSessionRoute,
  createWalletWithdrawalRoute,
  creditMyWalletRoute,
  debitMyWalletRoute,
} from "./mutations";
import {
  adminGetUserWalletRoute,
  adminListUserWalletTransactionsRoute,
  getMyWalletRoute,
  listMyWalletTransactionsRoute,
} from "./queries";

export * from "../../wallets/schemas";
export * from "./mutations";
export * from "./queries";

export const walletsRoutes = {
  getMyWallet: getMyWalletRoute,
  listMyWalletTransactions: listMyWalletTransactionsRoute,
  adminGetUserWallet: adminGetUserWalletRoute,
  adminListUserWalletTransactions: adminListUserWalletTransactionsRoute,
  creditMyWallet: creditMyWalletRoute,
  debitMyWallet: debitMyWalletRoute,
  createStripeTopupSession: createStripeTopupSessionRoute,
  createStripeTopupPaymentSheet: createStripeTopupPaymentSheetRoute,
  createWalletWithdrawal: createWalletWithdrawalRoute,
} as const;
