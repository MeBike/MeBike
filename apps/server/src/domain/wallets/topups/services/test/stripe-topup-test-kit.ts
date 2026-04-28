import type Stripe from "stripe";

import { Effect, Layer } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";
import { StripeClient } from "@/infrastructure/stripe";

import { WalletRepositoryLive } from "../../../repository/wallet.repository";
import { WalletServiceLive } from "../../../services/wallet.service";
import { PaymentAttemptRepositoryLive } from "../../repository/payment-attempt.repository";
import { sweepTopupReconciliation } from "../reconcile-topup.service";
import { createStripePaymentSheet } from "../request-stripe-topup.service";
import {
  handleStripePaymentIntentWebhookEvent,
} from "../stripe-topup-webhook.service";
import { StripeTopupServiceLive } from "../stripe-topup.service";

export function makeStripeTopupTestKit(args: {
  prisma: PrismaClient;
  createPaymentIntent: (...params: Array<unknown>) => unknown;
  retrievePaymentIntent?: (...params: Array<unknown>) => unknown;
}) {
  const prismaLayer = Layer.succeed(Prisma, Prisma.make({ client: args.prisma }));
  const stripeLayer = Layer.succeed(StripeClient, StripeClient.make({
    client: {
      paymentIntents: {
        create: args.createPaymentIntent,
        retrieve: args.retrievePaymentIntent ?? viMissingStripeMock("paymentIntents.retrieve"),
      },
    } as unknown as Stripe,
  }));

  const paymentAttemptRepoLayer = PaymentAttemptRepositoryLive.pipe(Layer.provide(prismaLayer));
  const walletRepoLayer = WalletRepositoryLive.pipe(Layer.provide(prismaLayer));
  const walletServiceLayer = WalletServiceLive.pipe(Layer.provide(walletRepoLayer));
  const stripeTopupLayer = StripeTopupServiceLive.pipe(
    Layer.provide(Layer.mergeAll(stripeLayer, paymentAttemptRepoLayer)),
  );

  const createLayer = Layer.mergeAll(stripeTopupLayer, walletServiceLayer);
  const webhookLayer = Layer.mergeAll(stripeTopupLayer, paymentAttemptRepoLayer, prismaLayer);

  return {
    createPaymentSheet(args: { userId: string; amountMinor: number }) {
      return Effect.runPromise(
        createStripePaymentSheet(args).pipe(Effect.provide(createLayer)),
      );
    },
    handleWebhook(event: Stripe.Event) {
      return Effect.runPromise(
        handleStripePaymentIntentWebhookEvent(event).pipe(Effect.provide(webhookLayer)),
      );
    },
    reconcileTopups(now: Date) {
      return Effect.runPromise(
        sweepTopupReconciliation(now).pipe(Effect.provide(webhookLayer)),
      );
    },
  };
}

function viMissingStripeMock(operation: string) {
  return () => {
    throw new Error(`Missing Stripe test mock for ${operation}`);
  };
}
