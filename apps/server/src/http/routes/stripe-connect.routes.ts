import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { WalletStripeController } from "@/http/controllers/wallets";
import { requireAuthMiddleware } from "@/http/middlewares/auth";

export function registerStripeConnectRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const stripeRoutes = serverRoutes.stripe;
  const startStripeConnectOnboardingRoute = {
    ...stripeRoutes.startStripeConnectOnboarding,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(startStripeConnectOnboardingRoute, WalletStripeController.startStripeConnectOnboarding);
}
