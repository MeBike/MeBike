import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getTestDatabase } from "@/test/db/test-database";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { PrismaClient } from "generated/prisma/client";

import { makePaymentAttemptRepository } from "../payment-attempt.repository";

describe("paymentAttemptRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makePaymentAttemptRepository>;

  beforeAll(async () => {
    container = await getTestDatabase();

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    repo = makePaymentAttemptRepository(client);
  }, 60000);

  afterEach(async () => {
    await client.paymentAttempt.deleteMany({});
    await client.wallet.deleteMany({});
    await client.user.deleteMany({});
  });

  afterAll(async () => {
    if (client)
      await client.$disconnect();
    if (container)
      await container.stop();
  });

  const createUserAndWallet = async () => {
    const userId = uuidv7();
    const user = await client.user.create({
      data: {
        id: userId,
        fullname: "Payment User",
        email: `user-${userId}@example.com`,
        passwordHash: "hash",
        role: "USER",
        verify: "VERIFIED",
      },
    });
    const wallet = await client.wallet.create({
      data: {
        userId: user.id,
        balance: 0n,
      },
    });
    return { userId: user.id, walletId: wallet.id };
  };

  const expectLeftTag = <E extends { _tag: string }>(
    result: Either.Either<unknown, E>,
    tag: E["_tag"],
  ) => {
    if (Either.isRight(result)) {
      throw new Error(`Expected Left ${tag}, got Right`);
    }
    expect(result.left._tag).toBe(tag);
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
        currency: "usd",
      }),
    );

    expect(attempt.userId).toBe(userId);
    expect(attempt.walletId).toBe(walletId);
    expect(attempt.provider).toBe("STRIPE");
    expect(attempt.status).toBe("PENDING");
    expect(attempt.amountMinor).toBe(10000n);
  });

  it("create rejects non-usd currency via db constraint", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const result = await Effect.runPromise(
      repo.create({
        userId,
        walletId,
        provider: "STRIPE",
        kind: "TOPUP",
        amountMinor: 10000n,
        currency: "vnd",
      }).pipe(Effect.either),
    );

    expectLeftTag(result, "PaymentAttemptRepositoryError");
    if (Either.isLeft(result)) {
      expect(result.left.operation).toBe("create");
    }
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
        currency: "usd",
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
        currency: "usd",
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
        currency: "usd",
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
        currency: "usd",
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
        currency: "usd",
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
        currency: "usd",
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
        currency: "usd",
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
        currency: "usd",
      }),
    );

    const providerRef = `cs_test_${uuidv7()}`;
    const updated = await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markSucceededIfPendingInTx(tx, created.id, providerRef),
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
        currency: "usd",
      }),
    );

    // First mark as succeeded
    await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markSucceededIfPendingInTx(tx, created.id, "ref1"),
      );
    });

    // Try to mark again (should return false - idempotent)
    const secondAttempt = await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markSucceededIfPendingInTx(tx, created.id, "ref2"),
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
        currency: "usd",
      }),
    );

    const failureReason = "User cancelled checkout";
    const updated = await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markFailedIfPendingInTx(tx, created.id, failureReason),
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
        currency: "usd",
      }),
    );

    // First mark as failed
    await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markFailedIfPendingInTx(tx, created.id, "First failure"),
      );
    });

    // Try to mark again (should return false - idempotent)
    const secondAttempt = await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markFailedIfPendingInTx(tx, created.id, "Second failure"),
      );
    });

    expect(secondAttempt).toBe(false);
  });
  it("returns PaymentAttemptRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    const brokenRepo = makePaymentAttemptRepository(broken.client);

    const result = await Effect.runPromise(
      brokenRepo.findById(uuidv7()).pipe(Effect.either),
    );

    expectLeftTag(result, "PaymentAttemptRepositoryError");

    await broken.stop();
  });
});
