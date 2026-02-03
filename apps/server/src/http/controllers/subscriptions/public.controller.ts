import type { RouteHandler } from "@hono/zod-openapi";

import { listSubscriptionPackages } from "@/domain/subscriptions/package-config";
import { toSubscriptionPackageDetail } from "@/http/presenters/subscriptions.presenter";

import type { SubscriptionsRoutes } from "./shared";

const listSubscriptionPackagesHandler: RouteHandler<SubscriptionsRoutes["listSubscriptionPackages"]> = async c =>
  c.json({
    data: listSubscriptionPackages().map(toSubscriptionPackageDetail),
  }, 200);

export const SubscriptionPublicController = {
  listSubscriptionPackages: listSubscriptionPackagesHandler,
} as const;
