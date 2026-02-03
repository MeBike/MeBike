import { serverRoutes } from "@mebike/shared";

import { SubscriptionMeController, SubscriptionPublicController } from "@/http/controllers/subscriptions";

export function registerSubscriptionRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const subscriptions = serverRoutes.subscriptions;

  app.openapi(subscriptions.listSubscriptionPackages, SubscriptionPublicController.listSubscriptionPackages);
  app.openapi(subscriptions.getSubscription, SubscriptionMeController.getSubscription);
  app.openapi(subscriptions.listSubscriptions, SubscriptionMeController.listSubscriptions);
  app.openapi(subscriptions.createSubscription, SubscriptionMeController.createSubscription);
  app.openapi(subscriptions.activateSubscription, SubscriptionMeController.activateSubscription);
}
