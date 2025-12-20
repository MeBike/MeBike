import {
  serverRoutes,
  SubscriptionsContracts,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
} from "@mebike/shared";
import { Data, Effect, Match, Option } from "effect";

import type { SubscriptionRow } from "@/domain/subscriptions";

import { withLoggedCause } from "@/domain/shared";
import { toPrismaDecimal } from "@/domain/shared/decimal";
import {
  activateSubscriptionUseCase,
  createSubscriptionUseCase,
} from "@/domain/subscriptions";
import { getUserByIdUseCase } from "@/domain/users";
import { withSubscriptionDeps } from "@/http/shared/providers";

class AuthenticatedUserMissing extends Data.TaggedError("AuthenticatedUserMissing")<Record<string, never>> {}

export function registerSubscriptionRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const subscriptions = serverRoutes.subscriptions;
  const { SubscriptionErrorCodeSchema, subscriptionErrorMessages } = SubscriptionsContracts;

  const mapSubscriptionDetail = (row: SubscriptionRow): SubscriptionsContracts.SubscriptionDetail => ({
    id: row.id,
    userId: row.userId,
    packageName: row.packageName,
    maxUsages: row.maxUsages,
    usageCount: row.usageCount,
    status: row.status,
    activatedAt: row.activatedAt ? row.activatedAt.toISOString() : null,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    price: row.price.toString(),
    updatedAt: row.updatedAt.toISOString(),
  });

  app.openapi(subscriptions.createSubscription, async (c) => {
    const userId = c.var.currentUser?.userId ?? null;
    if (!userId) {
      return c.json({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const body = c.req.valid("json");

    const eff = withLoggedCause(
      withSubscriptionDeps(Effect.gen(function* () {
        const userOpt = yield* getUserByIdUseCase(userId);
        if (Option.isNone(userOpt)) {
          return yield* Effect.fail(new AuthenticatedUserMissing({}));
        }
        const user = userOpt.value;
        return yield* createSubscriptionUseCase({
          userId,
          packageName: body.packageName,
          price: toPrismaDecimal(body.price),
          maxUsages: body.maxUsages ?? null,
          email: user.email,
          fullName: user.fullname,
        });
      })),
      "POST /v1/subscriptions/subscribe",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<SubscriptionsContracts.CreateSubscriptionResponse, 201>({
          data: mapSubscriptionDetail(right),
        }, 201)),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("SubscriptionPendingOrActiveExists", () =>
          c.json<SubscriptionsContracts.SubscriptionErrorResponse, 409>({
            error: subscriptionErrorMessages.SUBSCRIPTION_PENDING_OR_ACTIVE_EXISTS,
            details: { code: SubscriptionErrorCodeSchema.enum.SUBSCRIPTION_PENDING_OR_ACTIVE_EXISTS },
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
          c.json({
            error: unauthorizedErrorMessages.UNAUTHORIZED,
            details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
          }, 401)),
        Match.orElse(() =>
          c.json<SubscriptionsContracts.SubscriptionErrorResponse, 400>({
            error: subscriptionErrorMessages.SUBSCRIPTION_PENDING_OR_ACTIVE_EXISTS,
            details: { code: SubscriptionErrorCodeSchema.enum.SUBSCRIPTION_PENDING_OR_ACTIVE_EXISTS },
          }, 400)),
      )),
      Match.exhaustive,
    );
  });

  app.openapi(subscriptions.activateSubscription, async (c) => {
    const userId = c.var.currentUser?.userId ?? null;
    if (!userId) {
      return c.json({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const { subscriptionId } = c.req.valid("param");

    const eff = withLoggedCause(
      withSubscriptionDeps(activateSubscriptionUseCase({ subscriptionId })),
      "POST /v1/subscriptions/{subscriptionId}/activate",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<SubscriptionsContracts.ActivateSubscriptionResponse, 200>({
          data: mapSubscriptionDetail(right),
        }, 200)),
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
  });
}
