import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import type { WalletTestRepository } from "./wallet-repository-test-kit";

import { makeWalletTestRepository } from "./wallet-repository-test-kit";

describe("wallet Repository - Race Conditions", () => {
  const fixture = setupPrismaIntFixture();
  let repo: WalletTestRepository;

  beforeAll(() => {
    repo = makeWalletTestRepository(fixture.prisma);
  });

  it("concurrent decreaseBalance operations maintain consistency", async () => {
    const { id: userId } = await fixture.factories.user();
    await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    const results = await Promise.allSettled([
      Effect.runPromise(repo.decreaseBalance({ userId, amount: 30n }).pipe(Effect.either)),
      Effect.runPromise(repo.decreaseBalance({ userId, amount: 30n }).pipe(Effect.either)),
      Effect.runPromise(repo.decreaseBalance({ userId, amount: 30n }).pipe(Effect.either)),
      Effect.runPromise(repo.decreaseBalance({ userId, amount: 30n }).pipe(Effect.either)),
      Effect.runPromise(repo.decreaseBalance({ userId, amount: 30n }).pipe(Effect.either)),
    ]);

    const successful = results.filter(
      r => r.status === "fulfilled" && Either.isRight(r.value),
    ).length;
    const failed = results.filter(
      r => r.status === "fulfilled" && Either.isLeft(r.value),
    ).length;

    expect(successful).toBeGreaterThanOrEqual(3);
    expect(failed).toBeGreaterThan(0);

    const found = await Effect.runPromise(repo.findByUserId(userId));
    if (Option.isSome(found)) {
      const expectedBalance = 100 - (successful * 30);
      expect(found.value.balance.toString()).toBe(expectedBalance.toString());
    }
  });

  it("concurrent reserveBalance operations maintain consistency", async () => {
    const { id: userId } = await fixture.factories.user();
    const wallet = await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    const results = await Promise.allSettled([
      fixture.prisma.$transaction(tx =>
        Effect.runPromise(
          makeWalletTestRepository(tx).reserveBalance({ walletId: wallet.id, amount: 30n }),
        ),
      ),
      fixture.prisma.$transaction(tx =>
        Effect.runPromise(
          makeWalletTestRepository(tx).reserveBalance({ walletId: wallet.id, amount: 30n }),
        ),
      ),
      fixture.prisma.$transaction(tx =>
        Effect.runPromise(
          makeWalletTestRepository(tx).reserveBalance({ walletId: wallet.id, amount: 30n }),
        ),
      ),
      fixture.prisma.$transaction(tx =>
        Effect.runPromise(
          makeWalletTestRepository(tx).reserveBalance({ walletId: wallet.id, amount: 30n }),
        ),
      ),
      fixture.prisma.$transaction(tx =>
        Effect.runPromise(
          makeWalletTestRepository(tx).reserveBalance({ walletId: wallet.id, amount: 30n }),
        ),
      ),
    ]);

    const successful = results.filter(
      r => r.status === "fulfilled" && r.value === true,
    ).length;
    const failed = results.filter(
      r => r.status === "fulfilled" && r.value === false,
    ).length;

    expect(successful).toBeGreaterThanOrEqual(3);
    expect(failed).toBeGreaterThan(0);

    const updated = await fixture.prisma.wallet.findUnique({ where: { id: wallet.id } });
    const expectedReserved = successful * 30;
    expect(updated!.reservedBalance.toString()).toBe(expectedReserved.toString());
  });

  it("concurrent increase operations with same hash prevent duplicates", async () => {
    const { id: userId } = await fixture.factories.user();
    await Effect.runPromise(repo.createForUser(userId));

    const hash = `deposit:${uuidv7()}`;

    const results = await Promise.allSettled([
      Effect.runPromise(
        repo.increaseBalance({ userId, amount: 50n, hash }).pipe(Effect.either),
      ),
      Effect.runPromise(
        repo.increaseBalance({ userId, amount: 50n, hash }).pipe(Effect.either),
      ),
      Effect.runPromise(
        repo.increaseBalance({ userId, amount: 50n, hash }).pipe(Effect.either),
      ),
    ]);

    const successful = results.filter(
      r => r.status === "fulfilled" && Either.isRight(r.value),
    ).length;
    const duplicates = results.filter(
      r =>
        r.status === "fulfilled"
        && Either.isLeft(r.value)
        && r.value.left._tag === "WalletUniqueViolation",
    ).length;

    expect(successful).toBe(1);
    expect(duplicates).toBe(2);

    const found = await Effect.runPromise(repo.findByUserId(userId));
    if (Option.isSome(found)) {
      expect(found.value.balance.toString()).toBe("50");
    }
  });
});
