import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectLeftTag } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makePaymentAttemptRepository } from "../payment-attempt.repository";

describe("paymentAttemptRepository Integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makePaymentAttemptRepository>;

  beforeAll(() => {
    repo = makePaymentAttemptRepository(fixture.prisma);
  });

  const createUserAndWallet = async () => {
    const user = await fixture.factories.user({ fullname: "Payment User" });
    const wallet = await fixture.factories.wallet({ userId: user.id, balance: 0n });
    return { userId: user.id, walletId: wallet.id };
  };

  it("create succeeds with valid input", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const attempt = await Effect.runPromise(
      repo.create({
        userId,
        walletId,
        provider: "STRIPE",
        kind: "TOPUP",
        amountMinor: 10000n,
        currency: "vnd",
      }),
    );

    expect(attempt.userId).toBe(userId);
    expect(attempt.walletId).toBe(walletId);
    expect(attempt.provider).toBe("STRIPE");
    expect(attempt.status).toBe("PENDING");
    expect(attempt.amountMinor).toBe(10000n);
  });

  it("create persists provided currency", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const attempt = await Effect.runPromise(
      repo.create({
        userId,
        walletId,
        provider: "STRIPE",
        kind: "TOPUP",
        amountMinor: 10000n,
        currency: "eur",
      }),
    );

    expect(attempt.currency).toBe("eur");
  });

  it("findById returns Some for existing record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.create({
        userId,
        walletId,
        provider: "STRIPE",
        kind: "TOPUP",
        amountMinor: 5000n,
        currency: "vnd",
      }),
    );

    const found = await Effect.runPromise(repo.findById(created.id));
    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.id).toBe(created.id);
    }
  });

  it("findById returns None for missing record", async () => {
    const found = await Effect.runPromise(repo.findById(uuidv7()));
    expect(Option.isNone(found)).toBe(true);
  });

  it("findByProviderRef returns Some for matching provider+ref", async () => {
    const { userId, walletId } = await createUserAndWallet();
    const providerRef = `cs_test_${uuidv7()}`;

    await Effect.runPromise(
      repo.create({
        userId,
        walletId,
        provider: "STRIPE",
        providerRef,
        kind: "TOPUP",
        amountMinor: 7500n,
        currency: "vnd",
      }),
    );

    const found = await Effect.runPromise(
      repo.findByProviderRef("STRIPE", providerRef),
    );
    expect(Option.isSome(found)).toBe(true);
  });

  it("setProviderRef updates and returns row", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.create({
        userId,
        walletId,
        provider: "STRIPE",
        kind: "TOPUP",
        amountMinor: 2500n,
        currency: "vnd",
      }),
    );

    expect(created.providerRef).toBeNull();

    const newRef = `cs_test_${uuidv7()}`;
    const updated = await Effect.runPromise(
      repo.setProviderRef(created.id, newRef),
    );

    expect(updated.providerRef).toBe(newRef);
  });

  it("create returns PaymentAttemptUniqueViolation for duplicate (provider, providerRef)", async () => {
    const { userId, walletId } = await createUserAndWallet();
    const providerRef = `cs_test_${uuidv7()}`;

    await Effect.runPromise(
      repo.create({
        userId,
        walletId,
        provider: "STRIPE",
        providerRef,
        kind: "TOPUP",
        amountMinor: 1000n,
        currency: "vnd",
      }),
    );

    const result = await Effect.runPromise(
      repo.create({
        userId,
        walletId,
        provider: "STRIPE",
        providerRef, // same providerRef
        kind: "TOPUP",
        amountMinor: 2000n,
        currency: "vnd",
      }).pipe(Effect.either),
    );

    expectLeftTag(result, "PaymentAttemptUniqueViolation");
  });

  it("setProviderRef returns PaymentAttemptUniqueViolation on conflict", async () => {
    const { userId, walletId } = await createUserAndWallet();
    const existingRef = `cs_test_${uuidv7()}`;

    // Create first attempt with providerRef
    await Effect.runPromise(
      repo.create({
        userId,
        walletId,
        provider: "STRIPE",
        providerRef: existingRef,
        kind: "TOPUP",
        amountMinor: 1000n,
        currency: "vnd",
      }),
    );

    // Create second attempt without providerRef
    const second = await Effect.runPromise(
      repo.create({
        userId,
        walletId,
        provider: "STRIPE",
        kind: "TOPUP",
        amountMinor: 2000n,
        currency: "vnd",
      }),
    );

    // Try to set second's providerRef to existing one
    const result = await Effect.runPromise(
      repo.setProviderRef(second.id, existingRef).pipe(Effect.either),
    );

    expectLeftTag(result, "PaymentAttemptUniqueViolation");
  });

  it("markSucceededIfPendingInTx returns true for pending record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.create({
        userId,
        walletId,
        provider: "STRIPE",
        kind: "TOPUP",
        amountMinor: 5000n,
        currency: "vnd",
      }),
    );

    const providerRef = `cs_test_${uuidv7()}`;
    const updated = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makePaymentAttemptRepository(tx);
      return Effect.runPromise(
        txRepo.markSucceededIfPending(created.id, providerRef),
      );
    });

    expect(updated).toBe(true);

    // Verify status changed
    const found = await Effect.runPromise(repo.findById(created.id));
    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.status).toBe("SUCCEEDED");
      expect(found.value.providerRef).toBe(providerRef);
    }
  });

  it("markSucceededIfPendingInTx returns false for non-pending record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.create({
        userId,
        walletId,
        provider: "STRIPE",
        kind: "TOPUP",
        amountMinor: 5000n,
        currency: "vnd",
      }),
    );

    // First mark as succeeded
    await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makePaymentAttemptRepository(tx);
      return Effect.runPromise(
        txRepo.markSucceededIfPending(created.id, "ref1"),
      );
    });

    // Try to mark again (should return false - idempotent)
    const secondAttempt = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makePaymentAttemptRepository(tx);
      return Effect.runPromise(
        txRepo.markSucceededIfPending(created.id, "ref2"),
      );
    });

    expect(secondAttempt).toBe(false);
  });

  it("markFailedIfPendingInTx returns true for pending record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.create({
        userId,
        walletId,
        provider: "STRIPE",
        kind: "TOPUP",
        amountMinor: 3000n,
        currency: "vnd",
      }),
    );

    const failureReason = "User cancelled checkout";
    const updated = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makePaymentAttemptRepository(tx);
      return Effect.runPromise(
        txRepo.markFailedIfPending(created.id, failureReason),
      );
    });

    expect(updated).toBe(true);

    // Verify status changed
    const found = await Effect.runPromise(repo.findById(created.id));
    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.status).toBe("FAILED");
      expect(found.value.failureReason).toBe(failureReason);
    }
  });

  it("markFailedIfPendingInTx returns false for non-pending record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.create({
        userId,
        walletId,
        provider: "STRIPE",
        kind: "TOPUP",
        amountMinor: 3000n,
        currency: "vnd",
      }),
    );

    // First mark as failed
    await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makePaymentAttemptRepository(tx);
      return Effect.runPromise(
        txRepo.markFailedIfPending(created.id, "First failure"),
      );
    });

    // Try to mark again (should return false - idempotent)
    const secondAttempt = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makePaymentAttemptRepository(tx);
      return Effect.runPromise(
        txRepo.markFailedIfPending(created.id, "Second failure"),
      );
    });

    expect(secondAttempt).toBe(false);
  });
  it("returns PaymentAttemptRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    try {
      const brokenRepo = makePaymentAttemptRepository(broken.client);

      const result = await Effect.runPromise(
        brokenRepo.findById(uuidv7()).pipe(Effect.either),
      );

      expectLeftTag(result, "PaymentAttemptRepositoryError");
    }
    finally {
      await broken.stop();
    }
  });
});
