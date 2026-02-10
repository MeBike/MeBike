import { Data, Effect, Layer } from "effect";
import Stripe from "stripe";

import { env } from "@/config/env";

export class StripeInitError extends Data.TaggedError("StripeInitError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

const makeStripe = Effect.gen(function* () {
  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return yield* Effect.fail(new StripeInitError({
      message: "STRIPE_SECRET_KEY is required to initialize Stripe.",
    }));
  }

  const client = new Stripe(secretKey);
  return { client } as const satisfies { client: Stripe };
});

export class StripeClient extends Effect.Service<StripeClient>()("Stripe", {
  scoped: makeStripe,
}) {}

export const StripeLive = Layer.scoped(
  StripeClient,
  makeStripe.pipe(Effect.map(StripeClient.make)),
);
