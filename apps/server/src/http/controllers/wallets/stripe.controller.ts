import type { RouteHandler } from "@hono/zod-openapi";
import type { StripeContracts, WalletsContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import { env } from "@/config/env";
import { withLoggedCause } from "@/domain/shared";
import { handleStripeWebhookUseCase, startStripeConnectOnboardingUseCase } from "@/domain/wallets";
import { StripeClient, StripeWebhookError, verifyStripeWebhook } from "@/infrastructure/stripe";
import logger from "@/lib/logger";

import type { StripeRoutes } from "./shared";

import { unauthorizedBody, WalletErrorCodeSchema, walletErrorMessages } from "./shared";

const WALLET_DEEP_LINK = "mebike://wallet";

function renderWalletRedirectPage(title: string, message: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta http-equiv="refresh" content="0;url=${WALLET_DEEP_LINK}" />
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f8fafc;
        color: #0f172a;
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }
      main {
        width: min(420px, 100%);
        background: #ffffff;
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
      }
      h1 {
        font-size: 20px;
        margin: 0 0 12px;
      }
      p {
        line-height: 1.5;
        margin: 0;
      }
      a {
        display: inline-block;
        margin-top: 20px;
        color: #ffffff;
        background: #111827;
        text-decoration: none;
        padding: 12px 16px;
        border-radius: 999px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${message}</p>
      <a href="${WALLET_DEEP_LINK}">Open MeBike</a>
    </main>
    <script>
      window.location.replace(${JSON.stringify(WALLET_DEEP_LINK)});
    </script>
  </body>
</html>`;
}

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

async function handleStripeWebhookRequest(c: import("hono").Context, webhookSecret: string | undefined) {
  const payload = await c.req.text();
  const signature = c.req.header("stripe-signature");

  const result = await c.var.runPromise(
    Effect.gen(function* () {
      const stripe = (yield* StripeClient).client;
      const event = yield* verifyStripeWebhook(stripe, payload, signature, webhookSecret);
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

async function handleStripeWebhook(c: import("hono").Context) {
  return handleStripeWebhookRequest(c, env.STRIPE_WEBHOOK_SECRET);
}

async function handleStripeConnectWebhook(c: import("hono").Context) {
  return handleStripeWebhookRequest(c, env.STRIPE_CONNECT_WEBHOOK_SECRET);
}

function handleStripeConnectReturnRedirect(c: import("hono").Context) {
  return c.html(
    renderWalletRedirectPage(
      "Returning to MeBike",
      "Stripe setup is complete. You can continue in the MeBike wallet screen.",
    ),
  );
}

function handleStripeConnectRefreshRedirect(c: import("hono").Context) {
  return c.html(
    renderWalletRedirectPage(
      "Continue in MeBike",
      "Please return to MeBike to continue wallet payout setup.",
    ),
  );
}

export const WalletStripeController = {
  handleStripeConnectRefreshRedirect,
  handleStripeConnectReturnRedirect,
  handleStripeWebhook,
  handleStripeConnectWebhook,
  startStripeConnectOnboarding,
} as const;
