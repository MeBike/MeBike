import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { setupWalletRepositoryTests } from "./test-helpers";

describe("wallet Repository - Reserve/Release Balance", () => {
  const { getClient, getRepo, createUser, expectLeftTag } = setupWalletRepositoryTests();

  it("reserveBalanceInTx successfully reserves funds", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();
    const wallet = await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    await client.$transaction(async (tx) => {
      const reserved = await Effect.runPromise(
        repo.reserveBalanceInTx(tx, { walletId: wallet.id, amount: 30n }),
      );
      expect(reserved).toBe(true);
    });

    const updated = await client.wallet.findUnique({ where: { id: wallet.id } });
    expect(updated!.reservedBalance.toString()).toBe("30");
    expect(updated!.balance.toString()).toBe("100");
  });

  it("reserveBalanceInTx fails when insufficient available balance", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();
    const wallet = await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    await client.$transaction(async (tx) => {
      const reserved = await Effect.runPromise(
        repo.reserveBalanceInTx(tx, { walletId: wallet.id, amount: 150n }),
      );
      expect(reserved).toBe(false);
    });

    const updated = await client.wallet.findUnique({ where: { id: wallet.id } });
    expect(updated!.reservedBalance.toString()).toBe("0");
  });

  it("releaseReservedBalanceInTx successfully releases funds", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();
    const wallet = await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    await client.$transaction(async (tx) => {
      await Effect.runPromise(
        repo.reserveBalanceInTx(tx, { walletId: wallet.id, amount: 30n }),
      );
    });

    await client.$transaction(async (tx) => {
      const released = await Effect.runPromise(
        repo.releaseReservedBalanceInTx(tx, { walletId: wallet.id, amount: 30n }),
      );
      expect(released).toBe(true);
    });

    const updated = await client.wallet.findUnique({ where: { id: wallet.id } });
    expect(updated!.reservedBalance.toString()).toBe("0");
  });

  it("releaseReservedBalanceInTx fails when reserved balance is insufficient", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();
    const wallet = await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    await client.$transaction(async (tx) => {
      const released = await Effect.runPromise(
        repo.releaseReservedBalanceInTx(tx, { walletId: wallet.id, amount: 30n }),
      );
      expect(released).toBe(false);
    });

    const updated = await client.wallet.findUnique({ where: { id: wallet.id } });
    expect(updated!.reservedBalance.toString()).toBe("0");
  });

  it("decreaseBalance respects reserved balance constraint", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();
    const wallet = await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    await client.$transaction(async (tx) => {
      await Effect.runPromise(
        repo.reserveBalanceInTx(tx, { walletId: wallet.id, amount: 80n }),
      );
    });

    const result = await Effect.runPromise(
      repo.decreaseBalance({ userId, amount: 30n }).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletBalanceConstraint");

    const updated = await client.wallet.findUnique({ where: { id: wallet.id } });
    expect(updated!.balance.toString()).toBe("100");
    expect(updated!.reservedBalance.toString()).toBe("80");
  });

  it("reserveBalanceInTx rolls back on transaction failure", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();
    const wallet = await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    try {
      await client.$transaction(async (tx) => {
        await Effect.runPromise(
          repo.reserveBalanceInTx(tx, { walletId: wallet.id, amount: 30n }),
        );
        throw new Error("Simulated transaction failure");
      });
    }
    catch {
      // Expected
    }

    const updated = await client.wallet.findUnique({ where: { id: wallet.id } });
    expect(updated!.reservedBalance.toString()).toBe("0");
  });
});
