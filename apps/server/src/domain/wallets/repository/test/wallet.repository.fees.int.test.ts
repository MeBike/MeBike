import { Effect } from "effect";
import { beforeAll, describe, expect, it } from "vitest";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import type { WalletTestRepository } from "./wallet-repository-test-kit";

import { makeWalletTestRepository } from "./wallet-repository-test-kit";

describe("wallet Repository - Fee Handling", () => {
  const fixture = setupPrismaIntFixture();
  let repo: WalletTestRepository;

  beforeAll(() => {
    repo = makeWalletTestRepository(fixture.prisma);
  });

  it("increaseBalance deducts fees from amount", async () => {
    const { id: userId } = await fixture.factories.user();
    await Effect.runPromise(repo.createForUser(userId));

    const increased = await Effect.runPromise(
      repo.increaseBalance({ userId, amount: 100n, fee: 10n }),
    );
    expect(increased.balance.toString()).toBe("90");

    const transactions = await Effect.runPromise(
      repo.listTransactions(increased.id, { page: 1, pageSize: 10, sortBy: "createdAt", sortDir: "desc" }),
    );
    expect(transactions.items).toHaveLength(1);
    expect(transactions.items[0].amount.toString()).toBe("100");
    expect(transactions.items[0].fee.toString()).toBe("10");
  });

  it("increaseBalance deducts fees from amount inside a transaction", async () => {
    const { id: userId } = await fixture.factories.user();
    await Effect.runPromise(repo.createForUser(userId));

    await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWalletTestRepository(tx);
      const increased = await Effect.runPromise(
        txRepo.increaseBalance({ userId, amount: 100n, fee: 15n }),
      );
      expect(increased.balance.toString()).toBe("85");
    });
  });
});
