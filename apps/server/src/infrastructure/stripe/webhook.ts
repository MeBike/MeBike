import type { Buffer } from "node:buffer";
import type Stripe from "stripe";

import { Data, Effect } from "effect";

import { env } from "@/config/env";

export class StripeWebhookError extends Data.TaggedError("StripeWebhookError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

function getConfiguredStripeWebhookSecrets(): ReadonlyArray<string> {
  return [env.STRIPE_WEBHOOK_SECRET, env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(
    (secret): secret is string => Boolean(secret),
  );
}

export function verifyStripeWebhook(
  stripe: Stripe,
  payload: string | Buffer,
  signatureHeader: string | undefined,
  secret: string | ReadonlyArray<string> | undefined = getConfiguredStripeWebhookSecrets(),
): Effect.Effect<Stripe.Event, StripeWebhookError, never> {
  return Effect.try({
    try: () => {
      if (!signatureHeader) {
        throw new StripeWebhookError({
          message: "Missing Stripe signature header.",
        });
      }
      const secrets = Array.isArray(secret)
        ? secret.filter(candidate => candidate.length > 0)
        : secret
          ? [secret]
          : [];

      if (secrets.length === 0) {
        throw new StripeWebhookError({
          message: "A Stripe webhook secret is required to verify Stripe webhooks.",
        });
      }

      let lastCause: unknown;
      for (const candidate of secrets) {
        try {
          return stripe.webhooks.constructEvent(payload, signatureHeader, candidate);
        }
        catch (cause) {
          lastCause = cause;
        }
      }

      throw new StripeWebhookError({
        message: "Failed to verify Stripe webhook signature.",
        cause: lastCause,
      });
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
