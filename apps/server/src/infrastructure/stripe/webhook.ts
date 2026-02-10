import type { Buffer } from "node:buffer";
import type Stripe from "stripe";

import { Data, Effect } from "effect";

import { env } from "@/config/env";

export class StripeWebhookError extends Data.TaggedError("StripeWebhookError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export function verifyStripeWebhook(stripe: Stripe, payload: string | Buffer, signatureHeader: string | undefined, secret: string | undefined = env.STRIPE_WEBHOOK_SECRET): Effect.Effect<Stripe.Event, StripeWebhookError, never> {
  return Effect.try({
    try: () => {
      if (!signatureHeader) {
        throw new StripeWebhookError({
          message: "Missing Stripe signature header.",
        });
      }
      if (!secret) {
        throw new StripeWebhookError({
          message: "STRIPE_WEBHOOK_SECRET is required to verify Stripe webhooks.",
        });
      }
      return stripe.webhooks.constructEvent(payload, signatureHeader, secret);
    },
    catch: cause =>
      cause instanceof StripeWebhookError
        ? cause
        : new StripeWebhookError({
            message: "Failed to verify Stripe webhook signature.",
            cause,
          }),
  });
}
