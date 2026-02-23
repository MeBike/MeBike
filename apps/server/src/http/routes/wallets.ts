import { serverRoutes } from "@mebike/shared";

import { env } from "@/config/env";
import { WalletMeController } from "@/http/controllers/wallets";

export function registerWalletRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const wallets = serverRoutes.wallets;

  app.openapi(wallets.getMyWallet, WalletMeController.getMyWallet);
  app.openapi(wallets.listMyWalletTransactions, WalletMeController.listMyWalletTransactions);
  if (env.ENABLE_DEV_WALLET_MUTATIONS) {
    app.openapi(wallets.creditMyWallet, WalletMeController.creditMyWallet);
    app.openapi(wallets.debitMyWallet, WalletMeController.debitMyWallet);
  }
  app.openapi(wallets.createStripeTopupSession, WalletMeController.createStripeTopupSession);
  app.openapi(wallets.createWalletWithdrawal, WalletMeController.createWalletWithdrawal);
}
