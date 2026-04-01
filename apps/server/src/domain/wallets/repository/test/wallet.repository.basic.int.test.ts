import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { WalletRepositoryError } from "@/domain/wallets/domain-errors";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectDefect, expectLeftTag } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeWalletRepository } from "../wallet.repository";

describe("wallet Repository - Basic Operations", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeWalletRepository>;

  beforeAll(() => {
    repo = makeWalletRepository(fixture.prisma);
  });

  it("createForUser creates a wallet", async () => {
    const { id: userId } = await fixture.factories.user();

    const wallet = await Effect.runPromise(repo.createForUser(userId));
    expect(wallet.userId).toBe(userId);

    const found = await Effect.runPromise(repo.findByUserId(userId));
    expect(Option.isSome(found)).toBe(true);
  });

  it("createForUser rejects duplicate wallet", async () => {
    const { id: userId } = await fixture.factories.user();
    await Effect.runPromise(repo.createForUser(userId));

    const result = await Effect.runPromise(
      repo.createForUser(userId).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletUniqueViolation");
  });

  it("increaseBalance and decreaseBalance adjust balance", async () => {
    const { id: userId } = await fixture.factories.user();
    await Effect.runPromise(repo.createForUser(userId));

    const increased = await Effect.runPromise(
      repo.increaseBalance({ userId, amount: 100n }),
    );
    expect(increased.balance.toString()).toBe("100");

    const decreased = await Effect.runPromise(
      repo.decreaseBalance({ userId, amount: 30n }),
    );
    expect(decreased.balance.toString()).toBe("70");

    const transactions = await Effect.runPromise(
      repo.listTransactions(decreased.id, { page: 1, pageSize: 10, sortBy: "createdAt", sortDir: "desc" }),
    );
    expect(transactions.items).toHaveLength(2);
  });

  it("findTransactionListOwnerByUserId returns wallet owner context", async () => {
    const { id: userId } = await fixture.factories.user({ fullname: "Wallet Owner" });
    const wallet = await Effect.runPromise(repo.createForUser(userId));

    const owner = await Effect.runPromise(repo.findTransactionListOwnerByUserId(userId));

    expect(Option.isSome(owner)).toBe(true);
    if (Option.isSome(owner)) {
      expect(owner.value.walletId).toBe(wallet.id);
      expect(owner.value.user).toEqual({
        id: userId,
        fullName: "Wallet Owner",
      });
    }
  });

  it("listTransactions filters by status", async () => {
    const { id: userId } = await fixture.factories.user();
    const wallet = await Effect.runPromise(repo.createForUser(userId));

    await fixture.prisma.walletTransaction.createMany({
      data: [
        {
          walletId: wallet.id,
          amount: 100n,
          fee: 0n,
          type: "DEPOSIT",
          status: "SUCCESS",
        },
        {
          walletId: wallet.id,
          amount: 80n,
          fee: 0n,
          type: "DEPOSIT",
          status: "PENDING",
        },
      ],
    });

    const filtered = await Effect.runPromise(
      repo.listTransactions(wallet.id, { page: 1, pageSize: 10, sortBy: "createdAt", sortDir: "desc" }, {
        status: "PENDING",
      }),
    );

    expect(filtered.items).toHaveLength(1);
    expect(filtered.items[0].status).toBe("PENDING");
  });

  it("increaseBalance fails when wallet is missing", async () => {
    const result = await Effect.runPromise(
      repo.increaseBalance({ userId: uuidv7(), amount: 50n }).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletRecordNotFound");
  });

  it("increaseBalance returns WalletUniqueViolation for duplicate hash", async () => {
    const { id: userId } = await fixture.factories.user();
    await Effect.runPromise(repo.createForUser(userId));

    const hash = `refund:reservation:${uuidv7()}`;
    await Effect.runPromise(
      repo.increaseBalance({
        userId,
        amount: 25n,
        hash,
        type: "REFUND",
      }),
    );

    const result = await Effect.runPromise(
      repo.increaseBalance({
        userId,
        amount: 25n,
        hash,
        type: "REFUND",
      }).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletUniqueViolation");
  });

  it("decreaseBalance fails when balance is insufficient", async () => {
    const { id: userId } = await fixture.factories.user();
    await Effect.runPromise(repo.createForUser(userId));

    const result = await Effect.runPromise(
      repo.decreaseBalance({ userId, amount: 10n }).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletBalanceConstraint");
  });

  it("defects with WalletRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    try {
      const brokenRepo = makeWalletRepository(broken.client);

      await expectDefect(
        brokenRepo.findByUserId(uuidv7()),
        WalletRepositoryError,
        { operation: "findByUserId" },
      );
    }
    finally {
      await broken.stop();
    }
  });
});
