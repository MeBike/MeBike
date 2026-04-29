import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { WalletAdminController, WalletMeController } from "@/http/controllers/wallets";
import {
  requireAdminMiddleware,
  requireAuthMiddleware,
} from "@/http/middlewares/auth";

export function registerWalletRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const wallets = serverRoutes.wallets;

  const getMyWalletRoute = {
    ...wallets.getMyWallet,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const listMyWalletTransactionsRoute = {
    ...wallets.listMyWalletTransactions,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const createStripeTopupSessionRoute = {
    ...wallets.createStripeTopupSession,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const createStripeTopupPaymentSheetRoute = {
    ...wallets.createStripeTopupPaymentSheet,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const createWalletWithdrawalRoute = {
    ...wallets.createWalletWithdrawal,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(getMyWalletRoute, WalletMeController.getMyWallet);
  app.openapi(listMyWalletTransactionsRoute, WalletMeController.listMyWalletTransactions);
  // app.openapi(wallets.creditMyWallet, WalletMeController.creditMyWallet);
  // app.openapi(wallets.debitMyWallet, WalletMeController.debitMyWallet);
  app.openapi(createStripeTopupSessionRoute, WalletMeController.createStripeTopupSession);
  app.openapi(createStripeTopupPaymentSheetRoute, WalletMeController.createStripeTopupPaymentSheet);
  app.openapi(createWalletWithdrawalRoute, WalletMeController.createWalletWithdrawal);

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
