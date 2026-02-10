import type { RouteHandler } from "@hono/zod-openapi";
import type { StripeContracts, WalletsContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import { withLoggedCause } from "@/domain/shared";
import { handleStripeWebhookUseCase } from "@/domain/wallets";
import { startStripeConnectOnboardingUseCase } from "@/domain/wallets/withdrawals";
import { StripeClient, StripeWebhookError, verifyStripeWebhook } from "@/infrastructure/stripe";
import logger from "@/lib/logger";

import type { StripeRoutes } from "./shared";

import { unauthorizedBody, WalletErrorCodeSchema, walletErrorMessages } from "./shared";

const startStripeConnectOnboarding: RouteHandler<StripeRoutes["startStripeConnectOnboarding"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const body = c.req.valid("json");

  const eff = withLoggedCause(
    startStripeConnectOnboardingUseCase({
      userId,
      returnUrl: body.returnUrl,
      refreshUrl: body.refreshUrl,
    }),
    "POST /v1/stripe/connect/onboarding/start",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<StripeContracts.StripeConnectOnboardingResponse, 200>({
        data: {
          accountId: right.accountId,
          onboardingUrl: right.onboardingUrl,
        },
      }, 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("InvalidWithdrawalRequest", () =>
          c.json<WalletsContracts.WalletErrorResponse, 400>({
            error: walletErrorMessages.WITHDRAWAL_INVALID_REQUEST,
            details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_INVALID_REQUEST },
          }, 400)),
        Match.tag("StripeConnectNotEnabled", () =>
          c.json<WalletsContracts.WalletErrorResponse, 503>({
            error: "Stripe Connect is not enabled for this Stripe account",
            details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_INTERNAL_ERROR },
          }, 503)),
        Match.orElse(() =>
          c.json<WalletsContracts.WalletErrorResponse, 500>({
            error: walletErrorMessages.WITHDRAWAL_INTERNAL_ERROR,
            details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_INTERNAL_ERROR },
          }, 500)),
      )),
    Match.exhaustive,
  );
};

async function handleStripeWebhook(c: import("hono").Context) {
  const payload = await c.req.text();
  const signature = c.req.header("stripe-signature");

  const result = await c.var.runPromise(
    Effect.gen(function* () {
      const stripe = (yield* StripeClient).client;
      const event = yield* verifyStripeWebhook(stripe, payload, signature);
      return yield* handleStripeWebhookUseCase(event);
    }).pipe(Effect.either),
  );

  return Match.value(result).pipe(
    Match.tag("Left", ({ left }) => {
      if (left instanceof StripeWebhookError) {
        logger.warn({ err: left }, "Stripe webhook signature verification failed");
        return c.json({ error: "Invalid webhook signature" }, 400);
      }
      logger.error({ err: left }, "Stripe webhook processing failed");
      return c.json({ error: "Webhook processing failed" }, 500);
    }),
    Match.tag("Right", ({ right }) => {
      logger.info({ outcome: right }, "Stripe webhook processed");
      return c.json({ ok: true }, 200);
    }),
    Match.exhaustive,
  );
}

export const WalletStripeController = {
  handleStripeWebhook,
  startStripeConnectOnboarding,
} as const;
