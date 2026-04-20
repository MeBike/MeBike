import type Stripe from "stripe";

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeStripeTopupTestKit } from "./stripe-topup-test-kit";

describe("stripe topup PaymentSheet integration", () => {
  const fixture = setupPrismaIntFixture();
  const createPaymentIntent = vi.fn();
  let topup: ReturnType<typeof makeStripeTopupTestKit>;

  beforeAll(() => {
    topup = makeStripeTopupTestKit({
      prisma: fixture.prisma,
      createPaymentIntent,
    });
  });

  afterEach(async () => {
    createPaymentIntent.mockReset();
    await fixture.prisma.jobOutbox.deleteMany({});
  });

  const createUserAndWallet = async () => {
    const user = await fixture.factories.user({ fullname: "Stripe Wallet User" });
    const wallet = await fixture.factories.wallet({ userId: user.id, balance: 0n });

    return { userId: user.id, walletId: wallet.id };
  };

  it("creates a PaymentIntent-backed topup attempt", async () => {
    const { userId } = await createUserAndWallet();
    createPaymentIntent.mockResolvedValue({
      id: "pi_test_payment_sheet",
      client_secret: "pi_test_payment_sheet_secret_123",
    });

    const result = await topup.createPaymentSheet({
      userId,
      amountMinor: 10000,
    });

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

    const created = await topup.createPaymentSheet({
      userId,
      amountMinor: 12000,
    });

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

    const outcome = await topup.handleWebhook(event);

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
    expect(outboxRows).toHaveLength(0);

    const repeated = await topup.handleWebhook(event);
    expect(repeated).toEqual({ status: "ignored", reason: "already_succeeded" });

    const repeatedOutboxRows = await fixture.prisma.jobOutbox.findMany();
    expect(repeatedOutboxRows).toHaveLength(0);
  });

  it("marks the attempt failed on payment_intent.payment_failed", async () => {
    const { userId } = await createUserAndWallet();
    createPaymentIntent.mockResolvedValue({
      id: "pi_test_failed",
      client_secret: "pi_test_failed_secret_123",
    });

    const created = await topup.createPaymentSheet({
      userId,
      amountMinor: 9000,
    });

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

    const outcome = await topup.handleWebhook(event);

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
