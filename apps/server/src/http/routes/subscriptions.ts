import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  SubscriptionAdminController,
  SubscriptionMeController,
  SubscriptionPublicController,
} from "@/http/controllers/subscriptions";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerSubscriptionRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const subscriptions = serverRoutes.subscriptions;
  const adminListSubscriptionsRoute = {
    ...subscriptions.adminListSubscriptions,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminGetSubscriptionRoute = {
    ...subscriptions.adminGetSubscription,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(subscriptions.listSubscriptionPackages, SubscriptionPublicController.listSubscriptionPackages);
  app.openapi(subscriptions.getSubscription, SubscriptionMeController.getSubscription);
  app.openapi(subscriptions.listSubscriptions, SubscriptionMeController.listSubscriptions);
  app.openapi(subscriptions.createSubscription, SubscriptionMeController.createSubscription);
  app.openapi(subscriptions.activateSubscription, SubscriptionMeController.activateSubscription);
  app.openapi(adminListSubscriptionsRoute, SubscriptionAdminController.adminListSubscriptions);
  app.openapi(adminGetSubscriptionRoute, SubscriptionAdminController.adminGetSubscription);
}
