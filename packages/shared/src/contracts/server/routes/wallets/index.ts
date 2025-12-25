import {
  creditMyWalletRoute,
  debitMyWalletRoute,
} from "./mutations";
import {
  getMyWalletRoute,
  listMyWalletTransactionsRoute,
} from "./queries";

export * from "../../wallets/schemas";
export * from "./mutations";
export * from "./queries";

export const walletsRoutes = {
  getMyWallet: getMyWalletRoute,
  listMyWalletTransactions: listMyWalletTransactionsRoute,
  creditMyWallet: creditMyWalletRoute,
  debitMyWallet: debitMyWalletRoute,
} as const;
