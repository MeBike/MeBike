import type Stripe from "stripe";

import { Effect, Layer } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";
import { StripeClient } from "@/infrastructure/stripe";

import { WalletRepositoryLive } from "../../../repository/wallet.repository";
import { WalletServiceLive } from "../../../services/wallet.service";
import { PaymentAttemptRepositoryLive } from "../../repository/payment-attempt.repository";
import {
  createStripePaymentSheetUseCase,
  handleStripePaymentIntentWebhookEventUseCase,
} from "../stripe-topup.handlers";
import { StripeTopupServiceLive } from "../stripe-topup.service";

export function makeStripeTopupTestKit(args: {
  prisma: PrismaClient;
  createPaymentIntent: (...params: Array<unknown>) => unknown;
}) {
  const prismaLayer = Layer.succeed(Prisma, Prisma.make({ client: args.prisma }));
  const stripeLayer = Layer.succeed(StripeClient, StripeClient.make({
    client: {
      paymentIntents: {
        create: args.createPaymentIntent,
      },
    } as unknown as Stripe,
  }));

  const paymentAttemptRepoLayer = PaymentAttemptRepositoryLive.pipe(Layer.provide(prismaLayer));
  const walletRepoLayer = WalletRepositoryLive.pipe(Layer.provide(prismaLayer));
  const walletServiceLayer = WalletServiceLive.pipe(Layer.provide(walletRepoLayer));
  const stripeTopupLayer = StripeTopupServiceLive.pipe(
    Layer.provide(Layer.mergeAll(stripeLayer, paymentAttemptRepoLayer)),
  );

  const createUseCaseLayer = Layer.mergeAll(stripeTopupLayer, walletServiceLayer);
  const webhookLayer = Layer.mergeAll(stripeTopupLayer, prismaLayer);

  return {
    createPaymentSheet(args: { userId: string; amountMinor: number }) {
      return Effect.runPromise(
        createStripePaymentSheetUseCase(args).pipe(Effect.provide(createUseCaseLayer)),
      );
    },
    handleWebhook(event: Stripe.Event) {
      return Effect.runPromise(
        handleStripePaymentIntentWebhookEventUseCase(event).pipe(Effect.provide(webhookLayer)),
      );
    },
  };
}
