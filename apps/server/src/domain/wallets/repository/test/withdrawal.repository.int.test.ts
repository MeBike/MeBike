import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectDefect, expectLeftTag } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { WithdrawalRepositoryError } from "../../domain-errors";
import { makeWithdrawalRepository } from "../withdrawal.repository";

const FX_RATE = 26000n;

function makeVndWithdrawalData(input: {
  userId: string;
  walletId: string;
  amount: bigint;
  idempotencyKey: string;
}) {
  return {
    userId: input.userId,
    walletId: input.walletId,
    amount: input.amount,
    currency: "vnd",
    payoutAmount: (input.amount * 100n) / FX_RATE,
    payoutCurrency: "usd",
    fxRate: FX_RATE,
    fxQuotedAt: new Date("2026-03-06T00:00:00.000Z"),
    idempotencyKey: input.idempotencyKey,
  } as const;
}

describe("withdrawalRepository Integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeWithdrawalRepository>;

  beforeAll(() => {
    repo = makeWithdrawalRepository(fixture.prisma);
  });

  const createUserAndWallet = async () => {
    const user = await fixture.factories.user({ fullname: "Withdrawal User" });
    const wallet = await fixture.factories.wallet({
      userId: user.id,
      balance: 100000n,
    });
    return { userId: user.id, walletId: wallet.id };
  };

  it("createPending succeeds with valid input", async () => {
    const { userId, walletId } = await createUserAndWallet();
    const idempotencyKey = `withdraw:${uuidv7()}`;

    const withdrawal = await Effect.runPromise(
      repo.createPending(makeVndWithdrawalData({
        userId,
        walletId,
        amount: 50000n,
        idempotencyKey,
      })),
    );

    expect(withdrawal.userId).toBe(userId);
    expect(withdrawal.walletId).toBe(walletId);
    expect(withdrawal.status).toBe("PENDING");
    expect(withdrawal.amount).toBe(50000n);
    expect(withdrawal.idempotencyKey).toBe(idempotencyKey);
  });

  it("createPending persists provided currency fields", async () => {
    const { userId, walletId } = await createUserAndWallet();
    const idempotencyKey = `withdraw:${uuidv7()}`;

    const withdrawal = await Effect.runPromise(
      repo.createPending({
        userId,
        walletId,
        amount: 50000n,
        currency: "eur",
        payoutAmount: 192n,
        payoutCurrency: "usd",
        fxRate: FX_RATE,
        fxQuotedAt: new Date("2026-03-06T00:00:00.000Z"),
        idempotencyKey,
      }),
    );

    expect(withdrawal.currency).toBe("eur");
    expect(withdrawal.payoutCurrency).toBe("usd");
  });

  it("createPending fails with WithdrawalUniqueViolation on duplicate idempotencyKey", async () => {
    const { userId, walletId } = await createUserAndWallet();
    const idempotencyKey = `withdraw:${uuidv7()}`;

    await Effect.runPromise(
      repo.createPending(makeVndWithdrawalData({
        userId,
        walletId,
        amount: 25000n,
        idempotencyKey,
      })),
    );

    const result = await Effect.runPromise(
      repo.createPending(makeVndWithdrawalData({
        userId,
        walletId,
        amount: 99999n,
        idempotencyKey,
      })).pipe(Effect.either),
    );

    expectLeftTag(result, "WithdrawalUniqueViolation");
  });

  it("findById returns Some for existing record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.createPending({
        ...makeVndWithdrawalData({
          userId,
          walletId,
          amount: 10000n,
          idempotencyKey: `withdraw:${uuidv7()}`,
        }),
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
        ...makeVndWithdrawalData({
          userId,
          walletId,
          amount: 15000n,
          idempotencyKey,
        }),
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

  it("listByUserId returns paginated withdrawals scoped to owner", async () => {
    const first = await createUserAndWallet();
    const second = await createUserAndWallet();

    await Effect.runPromise(
      repo.createPending(makeVndWithdrawalData({
        ...first,
        amount: 10000n,
        idempotencyKey: `withdraw:${uuidv7()}`,
      })),
    );
    await Effect.runPromise(
      repo.createPending(makeVndWithdrawalData({
        ...first,
        amount: 20000n,
        idempotencyKey: `withdraw:${uuidv7()}`,
      })),
    );
    await Effect.runPromise(
      repo.createPending(makeVndWithdrawalData({
        ...second,
        amount: 30000n,
        idempotencyKey: `withdraw:${uuidv7()}`,
      })),
    );

    const page = await Effect.runPromise(
      repo.listByUserId(first.userId, { page: 1, pageSize: 10 }),
    );

    expect(page.total).toBe(2);
    expect(page.items).toHaveLength(2);
    expect(page.items.every(withdrawal => withdrawal.userId === first.userId)).toBe(true);
  });

  it("findByIdForUser returns None when withdrawal belongs to another user", async () => {
    const owner = await createUserAndWallet();
    const other = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.createPending(makeVndWithdrawalData({
        ...owner,
        amount: 18000n,
        idempotencyKey: `withdraw:${uuidv7()}`,
      })),
    );

    const found = await Effect.runPromise(
      repo.findByIdForUser(other.userId, created.id),
    );

    expect(Option.isNone(found)).toBe(true);
  });

  it("markProcessingInTx returns true for pending record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.createPending({
        ...makeVndWithdrawalData({
          userId,
          walletId,
          amount: 20000n,
          idempotencyKey: `withdraw:${uuidv7()}`,
        }),
      }),
    );

    const stripeTransferId = `tr_test_${uuidv7()}`;
    const updated = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWithdrawalRepository(tx);
      return Effect.runPromise(
        txRepo.markProcessing({
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
        ...makeVndWithdrawalData({
          userId,
          walletId,
          amount: 20000n,
          idempotencyKey: `withdraw:${uuidv7()}`,
        }),
      }),
    );

    // First mark as processing
    await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWithdrawalRepository(tx);
      return Effect.runPromise(
        txRepo.markProcessing({ withdrawalId: created.id }),
      );
    });

    // Try again (should return false - already processing)
    const secondAttempt = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWithdrawalRepository(tx);
      return Effect.runPromise(
        txRepo.markProcessing({ withdrawalId: created.id }),
      );
    });

    expect(secondAttempt).toBe(false);
  });

  it("markSucceededInTx returns true for pending/processing record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.createPending({
        ...makeVndWithdrawalData({
          userId,
          walletId,
          amount: 30000n,
          idempotencyKey: `withdraw:${uuidv7()}`,
        }),
      }),
    );

    const stripePayoutId = `po_test_${uuidv7()}`;
    const updated = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWithdrawalRepository(tx);
      return Effect.runPromise(
        txRepo.markSucceeded({
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
        ...makeVndWithdrawalData({
          userId,
          walletId,
          amount: 30000n,
          idempotencyKey: `withdraw:${uuidv7()}`,
        }),
      }),
    );

    // First mark as succeeded
    await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWithdrawalRepository(tx);
      return Effect.runPromise(
        txRepo.markSucceeded({ withdrawalId: created.id }),
      );
    });

    // Try again (should return false - already succeeded)
    const secondAttempt = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWithdrawalRepository(tx);
      return Effect.runPromise(
        txRepo.markSucceeded({ withdrawalId: created.id }),
      );
    });

    expect(secondAttempt).toBe(false);
  });

  it("markFailedInTx returns true for pending/processing record", async () => {
    const { userId, walletId } = await createUserAndWallet();

    const created = await Effect.runPromise(
      repo.createPending({
        ...makeVndWithdrawalData({
          userId,
          walletId,
          amount: 40000n,
          idempotencyKey: `withdraw:${uuidv7()}`,
        }),
      }),
    );

    const failureReason = "Insufficient Stripe balance";
    const updated = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWithdrawalRepository(tx);
      return Effect.runPromise(
        txRepo.markFailed({
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
        ...makeVndWithdrawalData({
          userId,
          walletId,
          amount: 40000n,
          idempotencyKey: `withdraw:${uuidv7()}`,
        }),
      }),
    );

    // First mark as failed
    await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWithdrawalRepository(tx);
      return Effect.runPromise(
        txRepo.markFailed({
          withdrawalId: created.id,
          failureReason: "First failure",
        }),
      );
    });

    // Try again (should return false - already failed)
    const secondAttempt = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWithdrawalRepository(tx);
      return Effect.runPromise(
        txRepo.markFailed({
          withdrawalId: created.id,
          failureReason: "Second failure",
        }),
      );
    });

    expect(secondAttempt).toBe(false);
  });

  it("defects with WithdrawalRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    try {
      const brokenRepo = makeWithdrawalRepository(broken.client);

      await expectDefect(
        brokenRepo.findById(uuidv7()),
        WithdrawalRepositoryError,
        { operation: "findById" },
      );
    }
    finally {
      await broken.stop();
    }
  });
});
