import { Effect } from "effect";
import { beforeAll, describe, expect, it } from "vitest";

import { expectLeftTag } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import type { WalletTestRepository } from "./wallet-repository-test-kit";

import { makeWalletTestRepository } from "./wallet-repository-test-kit";

describe("wallet Repository - Reserve/Release Balance", () => {
  const fixture = setupPrismaIntFixture();
  let repo: WalletTestRepository;

  beforeAll(() => {
    repo = makeWalletTestRepository(fixture.prisma);
  });

  it("reserveBalanceInTx successfully reserves funds", async () => {
    const { id: userId } = await fixture.factories.user();
    const wallet = await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWalletTestRepository(tx);
      const reserved = await Effect.runPromise(
        txRepo.reserveBalance({ walletId: wallet.id, amount: 30n }),
      );
      expect(reserved).toBe(true);
    });

    const updated = await fixture.prisma.wallet.findUnique({ where: { id: wallet.id } });
    expect(updated!.reservedBalance.toString()).toBe("30");
    expect(updated!.balance.toString()).toBe("100");
  });

  it("reserveBalanceInTx fails when insufficient available balance", async () => {
    const { id: userId } = await fixture.factories.user();
    const wallet = await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWalletTestRepository(tx);
      const reserved = await Effect.runPromise(
        txRepo.reserveBalance({ walletId: wallet.id, amount: 150n }),
      );
      expect(reserved).toBe(false);
    });

    const updated = await fixture.prisma.wallet.findUnique({ where: { id: wallet.id } });
    expect(updated!.reservedBalance.toString()).toBe("0");
  });

  it("releaseReservedBalanceInTx successfully releases funds", async () => {
    const { id: userId } = await fixture.factories.user();
    const wallet = await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWalletTestRepository(tx);
      await Effect.runPromise(
        txRepo.reserveBalance({ walletId: wallet.id, amount: 30n }),
      );
    });

    await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWalletTestRepository(tx);
      const released = await Effect.runPromise(
        txRepo.releaseReservedBalance({ walletId: wallet.id, amount: 30n }),
      );
      expect(released).toBe(true);
    });

    const updated = await fixture.prisma.wallet.findUnique({ where: { id: wallet.id } });
    expect(updated!.reservedBalance.toString()).toBe("0");
  });

  it("releaseReservedBalanceInTx fails when reserved balance is insufficient", async () => {
    const { id: userId } = await fixture.factories.user();
    const wallet = await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWalletTestRepository(tx);
      const released = await Effect.runPromise(
        txRepo.releaseReservedBalance({ walletId: wallet.id, amount: 30n }),
      );
      expect(released).toBe(false);
    });

    const updated = await fixture.prisma.wallet.findUnique({ where: { id: wallet.id } });
    expect(updated!.reservedBalance.toString()).toBe("0");
  });

  it("decreaseBalance respects reserved balance constraint", async () => {
    const { id: userId } = await fixture.factories.user();
    const wallet = await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeWalletTestRepository(tx);
      await Effect.runPromise(
        txRepo.reserveBalance({ walletId: wallet.id, amount: 80n }),
      );
    });

    const result = await Effect.runPromise(
      repo.decreaseBalance({ userId, amount: 30n }).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletBalanceConstraint");

    const updated = await fixture.prisma.wallet.findUnique({ where: { id: wallet.id } });
    expect(updated!.balance.toString()).toBe("100");
    expect(updated!.reservedBalance.toString()).toBe("80");
  });

  it("reserveBalanceInTx rolls back on transaction failure", async () => {
    const { id: userId } = await fixture.factories.user();
    const wallet = await Effect.runPromise(repo.createForUser(userId));
    await Effect.runPromise(repo.increaseBalance({ userId, amount: 100n }));

    try {
      await fixture.prisma.$transaction(async (tx) => {
        const txRepo = makeWalletTestRepository(tx);
        await Effect.runPromise(
          txRepo.reserveBalance({ walletId: wallet.id, amount: 30n }),
        );
        throw new Error("Simulated transaction failure");
      });
    }
    catch {
      // Expected
    }

    const updated = await fixture.prisma.wallet.findUnique({ where: { id: wallet.id } });
    expect(updated!.reservedBalance.toString()).toBe("0");
  });
});
