import { WalletStripeController } from "@/http/controllers/wallets";

export function registerStripeWebhookRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  app.post("/webhooks/stripe", WalletStripeController.handleStripeWebhook);
  app.post("/webhooks/stripe-connect", WalletStripeController.handleStripeConnectWebhook);
}
