import type { RouteHandler } from "@hono/zod-openapi";
import type { SubscriptionsContracts } from "@mebike/shared";

import { Data, Effect, Match, Option } from "effect";

import { withLoggedCause } from "@/domain/shared";
import { activateSubscriptionUseCase, createSubscriptionUseCase } from "@/domain/subscriptions";
import { SubscriptionServiceTag } from "@/domain/subscriptions/services/subscription.service";
import { UserServiceTag } from "@/domain/users";
import { toSubscriptionDetail } from "@/http/presenters/subscriptions.presenter";

import type { SubscriptionsRoutes } from "./shared";

import {
  SubscriptionErrorCodeSchema,
  subscriptionErrorMessages,
  unauthorizedBody,
} from "./shared";

class AuthenticatedUserMissing extends Data.TaggedError("AuthenticatedUserMissing")<
  Record<string, never>
> {}

const getSubscription: RouteHandler<SubscriptionsRoutes["getSubscription"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const { subscriptionId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(SubscriptionServiceTag, service => service.findById(subscriptionId)),
    "GET /v1/subscriptions/{subscriptionId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (Option.isNone(right) || right.value.userId !== userId) {
        return c.json<SubscriptionsContracts.SubscriptionErrorResponse, 404>({
          error: subscriptionErrorMessages.SUBSCRIPTION_NOT_FOUND,
          details: { code: SubscriptionErrorCodeSchema.enum.SUBSCRIPTION_NOT_FOUND },
        }, 404);
      }
      return c.json<SubscriptionsContracts.SubscriptionDetailResponse, 200>(
        toSubscriptionDetail(right.value),
        200,
      );
    }),
    Match.tag("Left", () =>
      c.json<SubscriptionsContracts.SubscriptionErrorResponse, 404>({
        error: subscriptionErrorMessages.SUBSCRIPTION_NOT_FOUND,
        details: { code: SubscriptionErrorCodeSchema.enum.SUBSCRIPTION_NOT_FOUND },
      }, 404)),
    Match.exhaustive,
  );
};

const listSubscriptions: RouteHandler<SubscriptionsRoutes["listSubscriptions"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const query = c.req.valid("query");
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 50;

  const eff = withLoggedCause(
    Effect.flatMap(SubscriptionServiceTag, service =>
      service.listForUser(userId, { status: query.status }, { page, pageSize })),
    "GET /v1/subscriptions",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<SubscriptionsContracts.ListSubscriptionsResponse, 200>({
        data: right.items.map(toSubscriptionDetail),
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

const createSubscription: RouteHandler<SubscriptionsRoutes["createSubscription"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserServiceTag;
      const userOpt = yield* service.getById(userId);
      if (Option.isNone(userOpt)) {
        return yield* Effect.fail(new AuthenticatedUserMissing({}));
      }
      const user = userOpt.value;
      return yield* createSubscriptionUseCase({
        userId,
        packageName: body.packageName,
        email: user.email,
        fullName: user.fullname,
      });
    }),
    "POST /v1/subscriptions/subscribe",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<SubscriptionsContracts.CreateSubscriptionResponse, 201>(toSubscriptionDetail(right), 201)),
    Match.tag("Left", ({ left }) => Match.value(left).pipe(
      Match.tag("SubscriptionPendingOrActiveExists", () =>
        c.json<SubscriptionsContracts.SubscriptionErrorResponse, 409>({
          error: subscriptionErrorMessages.SUBSCRIPTION_PENDING_OR_ACTIVE_EXISTS,
          details: {
            code: SubscriptionErrorCodeSchema.enum.SUBSCRIPTION_PENDING_OR_ACTIVE_EXISTS,
          },
        }, 409)),
      Match.tag("WalletNotFound", () =>
        c.json<SubscriptionsContracts.SubscriptionErrorResponse, 404>({
          error: subscriptionErrorMessages.WALLET_NOT_FOUND,
          details: { code: SubscriptionErrorCodeSchema.enum.WALLET_NOT_FOUND },
        }, 404)),
      Match.tag("InsufficientWalletBalance", () =>
        c.json<SubscriptionsContracts.SubscriptionErrorResponse, 400>({
          error: subscriptionErrorMessages.INSUFFICIENT_WALLET_BALANCE,
          details: { code: SubscriptionErrorCodeSchema.enum.INSUFFICIENT_WALLET_BALANCE },
        }, 400)),
      Match.tag("AuthenticatedUserMissing", () =>
        c.json(unauthorizedBody, 401)),
      Match.orElse(() =>
        c.json<SubscriptionsContracts.SubscriptionErrorResponse, 400>({
          error: subscriptionErrorMessages.SUBSCRIPTION_PENDING_OR_ACTIVE_EXISTS,
          details: {
            code: SubscriptionErrorCodeSchema.enum.SUBSCRIPTION_PENDING_OR_ACTIVE_EXISTS,
          },
        }, 400)),
    )),
    Match.exhaustive,
  );
};

const activateSubscription: RouteHandler<SubscriptionsRoutes["activateSubscription"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const { subscriptionId } = c.req.valid("param");

  const eff = withLoggedCause(
    activateSubscriptionUseCase({ subscriptionId }),
    "POST /v1/subscriptions/{subscriptionId}/activate",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<SubscriptionsContracts.ActivateSubscriptionResponse, 200>(toSubscriptionDetail(right), 200)),
    Match.tag("Left", ({ left }) => Match.value(left).pipe(
      Match.tag("SubscriptionNotFound", () =>
        c.json<SubscriptionsContracts.SubscriptionErrorResponse, 404>({
          error: subscriptionErrorMessages.SUBSCRIPTION_NOT_FOUND,
          details: { code: SubscriptionErrorCodeSchema.enum.SUBSCRIPTION_NOT_FOUND },
        }, 404)),
      Match.tag("SubscriptionNotPending", () =>
        c.json<SubscriptionsContracts.SubscriptionErrorResponse, 400>({
          error: subscriptionErrorMessages.SUBSCRIPTION_NOT_PENDING,
          details: { code: SubscriptionErrorCodeSchema.enum.SUBSCRIPTION_NOT_PENDING },
        }, 400)),
      Match.tag("ActiveSubscriptionExists", () =>
        c.json<SubscriptionsContracts.SubscriptionErrorResponse, 409>({
          error: subscriptionErrorMessages.ACTIVE_SUBSCRIPTION_EXISTS,
          details: { code: SubscriptionErrorCodeSchema.enum.ACTIVE_SUBSCRIPTION_EXISTS },
        }, 409)),
      Match.orElse(() =>
        c.json<SubscriptionsContracts.SubscriptionErrorResponse, 400>({
          error: subscriptionErrorMessages.SUBSCRIPTION_NOT_PENDING,
          details: { code: SubscriptionErrorCodeSchema.enum.SUBSCRIPTION_NOT_PENDING },
        }, 400)),
    )),
    Match.exhaustive,
  );
};

export const SubscriptionMeController = {
  activateSubscription,
  createSubscription,
  getSubscription,
  listSubscriptions,
} as const;
