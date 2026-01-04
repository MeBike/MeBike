import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { migrate } from "@/test/db/migrate";
import { startPostgres } from "@/test/db/postgres";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { PrismaClient } from "generated/prisma/client";

import { makeWithdrawalRepository } from "../withdrawal.repository";

describe("withdrawalRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeWithdrawalRepository>;

  beforeAll(async () => {
    container = await startPostgres();
    await migrate(container.url);

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    repo = makeWithdrawalRepository(client);
  }, 60000);

  afterEach(async () => {
    await client.walletWithdrawal.deleteMany({});
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
        fullname: "Withdrawal User",
        email: `user-${userId}@example.com`,
        passwordHash: "hash",
        role: "USER",
        verify: "VERIFIED",
      },
    });
    const wallet = await client.wallet.create({
      data: {
        userId: user.id,
        balance: 100000n,
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

  it("createPending succeeds with valid input", async () => {
    const { userId, walletId } = await createUserAndWallet();
    const idempotencyKey = `withdraw:${uuidv7()}`;

    const withdrawal = await Effect.runPromise(
      repo.createPending({
        userId,
        walletId,
        amount: 50000n,
        currency: "vnd",
        idempotencyKey,
      }),
    );

    expect(withdrawal.userId).toBe(userId);
    expect(withdrawal.walletId).toBe(walletId);
    expect(withdrawal.status).toBe("PENDING");
    expect(withdrawal.amount).toBe(50000n);
    expect(withdrawal.idempotencyKey).toBe(idempotencyKey);
  });

  it("createPending is idempotent - returns existing record on duplicate idempotencyKey", async () => {
    const { userId, walletId } = await createUserAndWallet();
    const idempotencyKey = `withdraw:${uuidv7()}`;

    const first = await Effect.runPromise(
      repo.createPending({
        userId,
        walletId,
        amount: 25000n,
        currency: "vnd",
        idempotencyKey,
      }),
    );

    // Second call with same idempotencyKey should return the existing record
    const second = await Effect.runPromise(
      repo.createPending({
        userId,
        walletId,
        amount: 99999n, // Different amount
        currency: "usd", // Different currency
        idempotencyKey, // Same key
      }),
    );

    expect(second.id).toBe(first.id);
    expect(second.amount).toBe(25000n); // Original amount preserved
    expect(second.currency).toBe("vnd"); // Original currency preserved
  });

  it("findById returns Some for existing record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.createPending({
        userId,
        walletId,
        amount: 10000n,
        currency: "vnd",
        idempotencyKey: `withdraw:${uuidv7()}`,
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

  it("findByIdempotencyKey returns Some for existing record", async () => {
    const { userId, walletId } = await createUserAndWallet();
    const idempotencyKey = `withdraw:${uuidv7()}`;

    await Effect.runPromise(
      repo.createPending({
        userId,
        walletId,
        amount: 15000n,
        currency: "vnd",
        idempotencyKey,
      }),
    );

    const found = await Effect.runPromise(repo.findByIdempotencyKey(idempotencyKey));
    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.idempotencyKey).toBe(idempotencyKey);
    }
  });

  it("findByIdempotencyKey returns None for missing key", async () => {
    const found = await Effect.runPromise(
      repo.findByIdempotencyKey(`withdraw:${uuidv7()}`),
    );
    expect(Option.isNone(found)).toBe(true);
  });

  it("markProcessingInTx returns true for pending record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.createPending({
        userId,
        walletId,
        amount: 20000n,
        currency: "vnd",
        idempotencyKey: `withdraw:${uuidv7()}`,
      }),
    );

    const stripeTransferId = `tr_test_${uuidv7()}`;
    const updated = await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markProcessingInTx(tx, {
          withdrawalId: created.id,
          stripeTransferId,
        }),
      );
    });

    expect(updated).toBe(true);

    const found = await Effect.runPromise(repo.findById(created.id));
    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.status).toBe("PROCESSING");
      expect(found.value.stripeTransferId).toBe(stripeTransferId);
    }
  });

  it("markProcessingInTx returns false for non-pending record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.createPending({
        userId,
        walletId,
        amount: 20000n,
        currency: "vnd",
        idempotencyKey: `withdraw:${uuidv7()}`,
      }),
    );

    // First mark as processing
    await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markProcessingInTx(tx, { withdrawalId: created.id }),
      );
    });

    // Try again (should return false - already processing)
    const secondAttempt = await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markProcessingInTx(tx, { withdrawalId: created.id }),
      );
    });

    expect(secondAttempt).toBe(false);
  });

  it("markSucceededInTx returns true for pending/processing record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.createPending({
        userId,
        walletId,
        amount: 30000n,
        currency: "vnd",
        idempotencyKey: `withdraw:${uuidv7()}`,
      }),
    );

    const stripePayoutId = `po_test_${uuidv7()}`;
    const updated = await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markSucceededInTx(tx, {
          withdrawalId: created.id,
          stripePayoutId,
        }),
      );
    });

    expect(updated).toBe(true);

    const found = await Effect.runPromise(repo.findById(created.id));
    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.status).toBe("SUCCEEDED");
      expect(found.value.stripePayoutId).toBe(stripePayoutId);
    }
  });

  it("markSucceededInTx returns false for already succeeded record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.createPending({
        userId,
        walletId,
        amount: 30000n,
        currency: "vnd",
        idempotencyKey: `withdraw:${uuidv7()}`,
      }),
    );

    // First mark as succeeded
    await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markSucceededInTx(tx, { withdrawalId: created.id }),
      );
    });

    // Try again (should return false - already succeeded)
    const secondAttempt = await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markSucceededInTx(tx, { withdrawalId: created.id }),
      );
    });

    expect(secondAttempt).toBe(false);
  });

  it("markFailedInTx returns true for pending/processing record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.createPending({
        userId,
        walletId,
        amount: 40000n,
        currency: "vnd",
        idempotencyKey: `withdraw:${uuidv7()}`,
      }),
    );

    const failureReason = "Insufficient Stripe balance";
    const updated = await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markFailedInTx(tx, {
          withdrawalId: created.id,
          failureReason,
        }),
      );
    });

    expect(updated).toBe(true);

    const found = await Effect.runPromise(repo.findById(created.id));
    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.status).toBe("FAILED");
      expect(found.value.failureReason).toBe(failureReason);
    }
  });

  it("markFailedInTx returns false for already failed record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.createPending({
        userId,
        walletId,
        amount: 40000n,
        currency: "vnd",
        idempotencyKey: `withdraw:${uuidv7()}`,
      }),
    );

    // First mark as failed
    await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markFailedInTx(tx, {
          withdrawalId: created.id,
          failureReason: "First failure",
        }),
      );
    });

    // Try again (should return false - already failed)
    const secondAttempt = await client.$transaction(async (tx) => {
      return Effect.runPromise(
        repo.markFailedInTx(tx, {
          withdrawalId: created.id,
          failureReason: "Second failure",
        }),
      );
    });

    expect(secondAttempt).toBe(false);
  });

  it("returns WithdrawalRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    const brokenRepo = makeWithdrawalRepository(broken.client);

    const result = await Effect.runPromise(
      brokenRepo.findById(uuidv7()).pipe(Effect.either),
    );

    expectLeftTag(result, "WithdrawalRepositoryError");

    await broken.stop();
  });
});
