import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { WalletAdminController, WalletMeController } from "@/http/controllers/wallets";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerWalletRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const wallets = serverRoutes.wallets;

  app.openapi(wallets.getMyWallet, WalletMeController.getMyWallet);
  app.openapi(wallets.listMyWalletTransactions, WalletMeController.listMyWalletTransactions);
  // app.openapi(wallets.creditMyWallet, WalletMeController.creditMyWallet);
  // app.openapi(wallets.debitMyWallet, WalletMeController.debitMyWallet);
  app.openapi(wallets.createStripeTopupSession, WalletMeController.createStripeTopupSession);
  app.openapi(wallets.createStripeTopupPaymentSheet, WalletMeController.createStripeTopupPaymentSheet);
  app.openapi(wallets.createWalletWithdrawal, WalletMeController.createWalletWithdrawal);

  const adminGetUserWalletRoute = {
    ...wallets.adminGetUserWallet,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminGetUserWalletRoute, WalletAdminController.adminGetUserWallet);

  const adminListUserWalletTransactionsRoute = {
    ...wallets.adminListUserWalletTransactions,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    adminListUserWalletTransactionsRoute,
    WalletAdminController.adminListUserWalletTransactions,
  );
}
