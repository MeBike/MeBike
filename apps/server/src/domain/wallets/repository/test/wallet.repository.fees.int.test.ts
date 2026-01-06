import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { setupWalletRepositoryTests } from "./test-helpers";

describe("wallet Repository - Fee Handling", () => {
  const { getClient, getRepo, createUser } = setupWalletRepositoryTests();

  it("increaseBalance deducts fees from amount", async () => {
    const repo = getRepo();
    const { id: userId } = await createUser();
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

  it("increaseBalanceInTx deducts fees from amount", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();
    await Effect.runPromise(repo.createForUser(userId));

    await client.$transaction(async (tx) => {
      const increased = await Effect.runPromise(
        repo.increaseBalanceInTx(tx, { userId, amount: 100n, fee: 15n }),
      );
      expect(increased.balance.toString()).toBe("85");
    });
  });
});
