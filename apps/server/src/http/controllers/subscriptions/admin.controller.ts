import type { RouteHandler } from "@hono/zod-openapi";
import type { SubscriptionsContracts } from "@mebike/shared";

import { Effect, Match, Option } from "effect";

import { withLoggedCause } from "@/domain/shared";
import { SubscriptionQueryServiceTag } from "@/domain/subscriptions";
import { toAdminSubscriptionDetail } from "@/http/presenters/subscriptions.presenter";

import type { SubscriptionsRoutes } from "./shared";

import {
  SubscriptionErrorCodeSchema,
  subscriptionErrorMessages,
} from "./shared";

const adminGetSubscription: RouteHandler<SubscriptionsRoutes["adminGetSubscription"]> = async (c) => {
  const { subscriptionId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(SubscriptionQueryServiceTag, service => service.getAdminById(subscriptionId)),
    "GET /v1/admin/subscriptions/{subscriptionId}",
  );

  const result = await c.var.runPromise(eff);

  if (Option.isNone(result)) {
    return c.json<SubscriptionsContracts.SubscriptionErrorResponse, 404>({
      error: subscriptionErrorMessages.SUBSCRIPTION_NOT_FOUND,
      details: { code: SubscriptionErrorCodeSchema.enum.SUBSCRIPTION_NOT_FOUND },
    }, 404);
  }

  return c.json<SubscriptionsContracts.AdminSubscriptionDetailResponse, 200>(
    toAdminSubscriptionDetail(result.value),
    200,
  );
};

const adminListSubscriptions: RouteHandler<SubscriptionsRoutes["adminListSubscriptions"]> = async (c) => {
  const query = c.req.valid("query");
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 50;

  const eff = withLoggedCause(
    Effect.flatMap(SubscriptionQueryServiceTag, service =>
      service.listAll({ status: query.status }, { page, pageSize })),
    "GET /v1/admin/subscriptions",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<SubscriptionsContracts.AdminListSubscriptionsResponse, 200>({
        data: right.items.map(toAdminSubscriptionDetail),
        pagination: {
          page: right.page,
          pageSize: right.pageSize,
          total: right.total,
          totalPages: right.totalPages,
        },
      }, 200)),
    Match.tag("Left", ({ left }) => {
      throw left;
    }),
    Match.exhaustive,
  );
};

export const SubscriptionAdminController = {
  adminGetSubscription,
  adminListSubscriptions,
} as const;
