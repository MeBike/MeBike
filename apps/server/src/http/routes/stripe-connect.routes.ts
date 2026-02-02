import { serverRoutes } from "@mebike/shared";

import { WalletStripeController } from "@/http/controllers/wallets";

export function registerStripeConnectRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const stripeRoutes = serverRoutes.stripe;
  app.openapi(stripeRoutes.startStripeConnectOnboarding, WalletStripeController.startStripeConnectOnboarding);
}
