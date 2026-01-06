import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { describe, expect, it } from "vitest";

import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";

import { makeWalletRepository } from "../wallet.repository";
import { setupWalletRepositoryTests } from "./test-helpers";

describe("wallet Repository - Basic Operations", () => {
  const { getRepo, createUser, expectLeftTag } = setupWalletRepositoryTests();

  it("createForUser creates a wallet", async () => {
    const repo = getRepo();
    const { id: userId } = await createUser();

    const wallet = await Effect.runPromise(repo.createForUser(userId));
    expect(wallet.userId).toBe(userId);

    const found = await Effect.runPromise(repo.findByUserId(userId));
    expect(Option.isSome(found)).toBe(true);
  });

  it("createForUser rejects duplicate wallet", async () => {
    const repo = getRepo();
    const { id: userId } = await createUser();
    await Effect.runPromise(repo.createForUser(userId));

    const result = await Effect.runPromise(
      repo.createForUser(userId).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletUniqueViolation");
  });

  it("increaseBalance and decreaseBalance adjust balance", async () => {
    const repo = getRepo();
    const { id: userId } = await createUser();
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

  it("increaseBalance fails when wallet is missing", async () => {
    const repo = getRepo();
    const result = await Effect.runPromise(
      repo.increaseBalance({ userId: uuidv7(), amount: 50n }).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletRecordNotFound");
  });

  it("increaseBalance returns WalletUniqueViolation for duplicate hash", async () => {
    const repo = getRepo();
    const { id: userId } = await createUser();
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
    const repo = getRepo();
    const { id: userId } = await createUser();
    await Effect.runPromise(repo.createForUser(userId));

    const result = await Effect.runPromise(
      repo.decreaseBalance({ userId, amount: 10n }).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletBalanceConstraint");
  });

  it("returns WalletRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    const brokenRepo = makeWalletRepository(broken.client);

    const result = await Effect.runPromise(
      brokenRepo.findByUserId(uuidv7()).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletRepositoryError");

    await broken.stop();
  });
});
