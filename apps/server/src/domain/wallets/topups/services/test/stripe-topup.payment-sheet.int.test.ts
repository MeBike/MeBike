import type Stripe from "stripe";

import { Effect, Layer } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/infrastructure/prisma";
import { StripeClient } from "@/infrastructure/stripe";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { WalletRepositoryLive } from "../../../repository/wallet.repository";
import { WalletServiceLive } from "../../../services/wallet.service";
import { PaymentAttemptRepositoryLive } from "../../repository/payment-attempt.repository";
import {
  createStripePaymentSheetUseCase,
  handleStripePaymentIntentWebhookEventUseCase,
} from "../stripe-topup.handlers";
import { StripeTopupServiceLive } from "../stripe-topup.service";

describe("stripe topup PaymentSheet integration", () => {
  const fixture = setupPrismaIntFixture();
  const createPaymentIntent = vi.fn();

  afterEach(async () => {
    createPaymentIntent.mockReset();
    await fixture.prisma.jobOutbox.deleteMany({});
  });

  const createUserAndWallet = async () => {
    const user = await fixture.factories.user({ fullname: "Stripe Wallet User" });
    const wallet = await fixture.factories.wallet({ userId: user.id, balance: 0n });

    return { userId: user.id, walletId: wallet.id };
  };

  const makeDepsLayer = () => {
    const prismaLayer = Layer.succeed(Prisma, Prisma.make({ client: fixture.prisma }));
    const stripeLayer = Layer.succeed(StripeClient, StripeClient.make({
      client: {
        paymentIntents: {
          create: createPaymentIntent,
        },
      } as unknown as Stripe,
    }));

    const paymentAttemptRepoLayer = PaymentAttemptRepositoryLive.pipe(Layer.provide(prismaLayer));
    const walletRepoLayer = WalletRepositoryLive.pipe(Layer.provide(prismaLayer));
    const walletServiceLayer = WalletServiceLive.pipe(Layer.provide(walletRepoLayer));
    const stripeTopupLayer = StripeTopupServiceLive.pipe(
      Layer.provide(Layer.mergeAll(stripeLayer, paymentAttemptRepoLayer)),
    );

    return {
      prismaLayer,
      createUseCaseLayer: Layer.mergeAll(stripeTopupLayer, walletServiceLayer),
      webhookLayer: Layer.mergeAll(stripeTopupLayer, prismaLayer),
    };
  };

  it("creates a PaymentIntent-backed topup attempt", async () => {
    const { userId } = await createUserAndWallet();
    createPaymentIntent.mockResolvedValue({
      id: "pi_test_payment_sheet",
      client_secret: "pi_test_payment_sheet_secret_123",
    });

    const { createUseCaseLayer } = makeDepsLayer();
    const result = await Effect.runPromise(
      createStripePaymentSheetUseCase({
        userId,
        amountMinor: 10000,
      }).pipe(Effect.provide(createUseCaseLayer)),
    );

    expect(result.paymentIntentClientSecret).toBe("pi_test_payment_sheet_secret_123");

    const attempt = await fixture.prisma.paymentAttempt.findUnique({ where: { id: result.paymentAttemptId } });
    expect(attempt?.providerRef).toBe("pi_test_payment_sheet");
    expect(attempt?.status).toBe("PENDING");
    expect(attempt?.metadata).toEqual({ mode: "payment_sheet" });
  });

  it("credits the wallet on payment_intent.succeeded", async () => {
    const { userId } = await createUserAndWallet();
    createPaymentIntent.mockResolvedValue({
      id: "pi_test_success",
      client_secret: "pi_test_success_secret_123",
    });

    const layers = makeDepsLayer();
    const created = await Effect.runPromise(
      createStripePaymentSheetUseCase({
        userId,
        amountMinor: 12000,
      }).pipe(Effect.provide(layers.createUseCaseLayer)),
    );

    const event = {
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test_success",
          amount_received: 12000,
          currency: "vnd",
          metadata: {
            paymentAttemptId: created.paymentAttemptId,
          },
        },
      },
    } as unknown as Stripe.Event;

    const outcome = await Effect.runPromise(
      handleStripePaymentIntentWebhookEventUseCase(event).pipe(Effect.provide(layers.webhookLayer)),
    );

    expect(outcome).toEqual({
      status: "succeeded",
      paymentAttemptId: created.paymentAttemptId,
    });

    const wallet = await fixture.prisma.wallet.findUnique({ where: { userId } });
    expect(wallet?.balance).toBe(12000n);

    const txs = await fixture.prisma.walletTransaction.findMany({
      where: { walletId: wallet?.id },
      orderBy: { createdAt: "desc" },
    });
    expect(txs).toHaveLength(1);
    expect(txs[0]?.hash).toBe("stripe:payment_intent:pi_test_success");

    const outboxRows = await fixture.prisma.jobOutbox.findMany({
      orderBy: { createdAt: "asc" },
    });
    expect(outboxRows).toHaveLength(1);
    expect(outboxRows[0]?.type).toBe("notifications.push.send");
    expect(outboxRows[0]?.dedupeKey).toBe(`wallet:topup:push:${created.paymentAttemptId}`);
    expect(outboxRows[0]?.payload).toEqual({
      version: 1,
      userId,
      event: "wallets.topupSucceeded",
      title: "Top-up successful",
      body: "Your wallet has been credited with ₫12,000.",
      channelId: "default",
      data: {
        paymentAttemptId: created.paymentAttemptId,
        amountMinor: "12000",
        currency: "vnd",
        providerRef: "pi_test_success",
        provider: "stripe",
      },
    });

    const repeated = await Effect.runPromise(
      handleStripePaymentIntentWebhookEventUseCase(event).pipe(Effect.provide(layers.webhookLayer)),
    );
    expect(repeated).toEqual({ status: "ignored", reason: "already_succeeded" });

    const repeatedOutboxRows = await fixture.prisma.jobOutbox.findMany();
    expect(repeatedOutboxRows).toHaveLength(1);
  });

  it("marks the attempt failed on payment_intent.payment_failed", async () => {
    const { userId } = await createUserAndWallet();
    createPaymentIntent.mockResolvedValue({
      id: "pi_test_failed",
      client_secret: "pi_test_failed_secret_123",
    });

    const layers = makeDepsLayer();
    const created = await Effect.runPromise(
      createStripePaymentSheetUseCase({
        userId,
        amountMinor: 9000,
      }).pipe(Effect.provide(layers.createUseCaseLayer)),
    );

    const event = {
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_test_failed",
          currency: "vnd",
          metadata: {
            paymentAttemptId: created.paymentAttemptId,
          },
          last_payment_error: {
            message: "Card was declined",
          },
        },
      },
    } as unknown as Stripe.Event;

    const outcome = await Effect.runPromise(
      handleStripePaymentIntentWebhookEventUseCase(event).pipe(Effect.provide(layers.webhookLayer)),
    );

    expect(outcome).toEqual({
      status: "failed",
      paymentAttemptId: created.paymentAttemptId,
      reason: "Card was declined",
    });

    const attempt = await fixture.prisma.paymentAttempt.findUnique({ where: { id: created.paymentAttemptId } });
    expect(attempt?.status).toBe("FAILED");

    const wallet = await fixture.prisma.wallet.findUnique({ where: { userId } });
    expect(wallet?.balance).toBe(0n);

    const txs = await fixture.prisma.walletTransaction.findMany({ where: { walletId: wallet?.id } });
    expect(txs).toHaveLength(0);

    const outboxRows = await fixture.prisma.jobOutbox.findMany();
    expect(outboxRows).toHaveLength(0);
  });
});
