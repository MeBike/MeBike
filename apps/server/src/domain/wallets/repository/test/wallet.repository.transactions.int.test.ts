import { Effect, Option } from "effect";
import { describe, expect, it } from "vitest";

import { makeWalletRepository } from "../wallet.repository";
import { setupWalletRepositoryTests } from "./test-helpers";

describe("wallet Repository - Transaction-Scoped Operations", () => {
  const { getClient, getRepo, createUser } = setupWalletRepositoryTests();

  it("findByUserIdInTx finds wallet within transaction", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();
    await Effect.runPromise(repo.createForUser(userId));

    await client.$transaction(async (tx) => {
      const txRepo = makeWalletRepository(tx);
      const found = await Effect.runPromise(txRepo.findByUserId(userId));
      expect(Option.isSome(found)).toBe(true);
    });
  });

  it("createForUserInTx commits on success", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();

    await client.$transaction(async (tx) => {
      const txRepo = makeWalletRepository(tx);
      const wallet = await Effect.runPromise(txRepo.createForUser(userId));
      expect(wallet.userId).toBe(userId);
    });

    const found = await Effect.runPromise(repo.findByUserId(userId));
    expect(Option.isSome(found)).toBe(true);
  });

  it("createForUserInTx rolls back on transaction failure", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();

    try {
      await client.$transaction(async (tx) => {
        const txRepo = makeWalletRepository(tx);
        await Effect.runPromise(txRepo.createForUser(userId));
        throw new Error("Simulated transaction failure");
      });
    }
    catch {
      // Expected
    }

    const found = await Effect.runPromise(repo.findByUserId(userId));
    expect(Option.isNone(found)).toBe(true);
  });

  it("increaseBalanceInTx commits on success", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();
    await Effect.runPromise(repo.createForUser(userId));

    await client.$transaction(async (tx) => {
      const txRepo = makeWalletRepository(tx);
      const increased = await Effect.runPromise(
        txRepo.increaseBalance({ userId, amount: 100n }),
      );
      expect(increased.balance.toString()).toBe("100");
    });

    const found = await Effect.runPromise(repo.findByUserId(userId));
    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.balance.toString()).toBe("100");
    }
  });

  it("increaseBalanceInTx rolls back on transaction failure", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();
    await Effect.runPromise(repo.createForUser(userId));

    try {
      await client.$transaction(async (tx) => {
        const txRepo = makeWalletRepository(tx);
        await Effect.runPromise(
          txRepo.increaseBalance({ userId, amount: 100n }),
        );
        throw new Error("Simulated transaction failure");
      });
    }
    catch {
      // Expected
    }

    const found = await Effect.runPromise(repo.findByUserId(userId));
    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.balance.toString()).toBe("0");
    }
  });

  it("decreaseBalanceInTx commits on success", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();
    await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    await client.$transaction(async (tx) => {
      const txRepo = makeWalletRepository(tx);
      const decreased = await Effect.runPromise(
        txRepo.decreaseBalance({ userId, amount: 30n }),
      );
      expect(decreased.balance.toString()).toBe("70");
    });

    const found = await Effect.runPromise(repo.findByUserId(userId));
    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.balance.toString()).toBe("70");
    }
  });

  it("decreaseBalanceInTx rolls back on transaction failure", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();
    await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    try {
      await client.$transaction(async (tx) => {
        const txRepo = makeWalletRepository(tx);
        await Effect.runPromise(
          txRepo.decreaseBalance({ userId, amount: 30n }),
        );
        throw new Error("Simulated transaction failure");
      });
    }
    catch {
      // Expected
    }

    const found = await Effect.runPromise(repo.findByUserId(userId));
    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.balance.toString()).toBe("100");
    }
  });

  it("increaseBalance uses outer transaction when using tx client", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();
    await Effect.runPromise(repo.createForUser(userId));

    try {
      await client.$transaction(async (tx) => {
        const txRepo = makeWalletRepository(tx);
        await Effect.runPromise(txRepo.increaseBalance({ userId, amount: 100n }));
        throw new Error("Simulated transaction failure");
      });
    }
    catch {
      // Expected
    }

    const found = await Effect.runPromise(repo.findByUserId(userId));
    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.balance.toString()).toBe("0");
    }
  });

  it("decreaseBalance uses outer transaction when using tx client", async () => {
    const client = getClient();
    const repo = getRepo();
    const { id: userId } = await createUser();
    await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    try {
      await client.$transaction(async (tx) => {
        const txRepo = makeWalletRepository(tx);
        await Effect.runPromise(txRepo.decreaseBalance({ userId, amount: 30n }));
        throw new Error("Simulated transaction failure");
      });
    }
    catch {
      // Expected
    }

    const found = await Effect.runPromise(repo.findByUserId(userId));
    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.balance.toString()).toBe("100");
    }
  });
});
