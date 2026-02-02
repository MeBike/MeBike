import { serverRoutes } from "@mebike/shared";

import { WalletMeController } from "@/http/controllers/wallets";

export function registerWalletRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const wallets = serverRoutes.wallets;

  app.openapi(wallets.getMyWallet, WalletMeController.getMyWallet);
  app.openapi(wallets.listMyWalletTransactions, WalletMeController.listMyWalletTransactions);
  app.openapi(wallets.creditMyWallet, WalletMeController.creditMyWallet);
  app.openapi(wallets.debitMyWallet, WalletMeController.debitMyWallet);
  app.openapi(wallets.createStripeTopupSession, WalletMeController.createStripeTopupSession);
  app.openapi(wallets.createWalletWithdrawal, WalletMeController.createWalletWithdrawal);
}
