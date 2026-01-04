import { Effect, Match } from "effect";

import { handleStripeWebhookUseCase } from "@/domain/wallets";
import { withStripeWebhookDeps } from "@/http/shared/providers";
import { StripeClient, StripeWebhookError, verifyStripeWebhook } from "@/infrastructure/stripe";
import logger from "@/lib/logger";

export function registerStripeWebhookRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  app.post("/webhooks/stripe", async (c) => {
    const payload = await c.req.text();
    const signature = c.req.header("stripe-signature");

    const result = await Effect.runPromise(
      withStripeWebhookDeps(
        Effect.gen(function* () {
          const stripe = (yield* StripeClient).client;
          const event = yield* verifyStripeWebhook(stripe, payload, signature);
          return yield* handleStripeWebhookUseCase(event);
        }).pipe(Effect.either),
      ),
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
  });
}
