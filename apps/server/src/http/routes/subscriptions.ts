import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  SubscriptionAdminController,
  SubscriptionMeController,
  SubscriptionPublicController,
} from "@/http/controllers/subscriptions";
import {
  requireAdminMiddleware,
  requireAuthMiddleware,
} from "@/http/middlewares/auth";

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

  const listSubscriptionPackagesRoute = {
    ...subscriptions.listSubscriptionPackages,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const getSubscriptionRoute = {
    ...subscriptions.getSubscription,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const listSubscriptionsRoute = {
    ...subscriptions.listSubscriptions,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const createSubscriptionRoute = {
    ...subscriptions.createSubscription,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const activateSubscriptionRoute = {
    ...subscriptions.activateSubscription,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(listSubscriptionPackagesRoute, SubscriptionPublicController.listSubscriptionPackages);
  app.openapi(getSubscriptionRoute, SubscriptionMeController.getSubscription);
  app.openapi(listSubscriptionsRoute, SubscriptionMeController.listSubscriptions);
  app.openapi(createSubscriptionRoute, SubscriptionMeController.createSubscription);
  app.openapi(activateSubscriptionRoute, SubscriptionMeController.activateSubscription);
  app.openapi(adminListSubscriptionsRoute, SubscriptionAdminController.adminListSubscriptions);
  app.openapi(adminGetSubscriptionRoute, SubscriptionAdminController.adminGetSubscription);
}
