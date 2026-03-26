import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenActiveRental, givenUserWithWallet } from "@/test/scenarios";

import { makeWalletHoldRepository } from "../wallet-hold.repository";

describe("wallet hold repository integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeWalletHoldRepository>;

  beforeAll(() => {
    repo = makeWalletHoldRepository(fixture.prisma);
  });

  it("creates a withdrawal hold", async () => {
    const { user } = await givenUserWithWallet(fixture, { wallet: { balance: 1000n } });
    const wallet = await fixture.prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    const withdrawal = await fixture.prisma.walletWithdrawal.create({
      data: {
        userId: user.id,
        walletId: wallet.id,
        amount: 300n,
        currency: "VND",
        idempotencyKey: uuidv7(),
      },
    });

    const created = await Effect.runPromise(repo.create({
      walletId: wallet.id,
      withdrawalId: withdrawal.id,
      amount: 300n,
    }));

    expect(created.withdrawalId).toBe(withdrawal.id);
    expect(created.rentalId).toBeNull();
    expect(created.reason).toBe("WITHDRAWAL");
    expect(created.forfeitedAt).toBeNull();
  });

  it("creates a rental deposit hold", async () => {
    const { user, rental } = await givenActiveRental(fixture, { wallet: { balance: 5000n } });
    const wallet = await fixture.prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });

    const created = await Effect.runPromise(repo.create({
      walletId: wallet.id,
      rentalId: rental.id,
      amount: 2000n,
      reason: "RENTAL_DEPOSIT",
    }));

    expect(created.withdrawalId).toBeNull();
    expect(created.rentalId).toBe(rental.id);
    expect(created.reason).toBe("RENTAL_DEPOSIT");
    expect(created.forfeitedAt).toBeNull();

    const activeByRental = await Effect.runPromise(repo.findActiveByRentalId(rental.id));
    expect(Option.isSome(activeByRental)).toBe(true);
  });

  it("releases a hold by id", async () => {
    const { user, rental } = await givenActiveRental(fixture, { wallet: { balance: 5000n } });
    const wallet = await fixture.prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    const created = await Effect.runPromise(repo.create({
      walletId: wallet.id,
      rentalId: rental.id,
      amount: 2000n,
      reason: "RENTAL_DEPOSIT",
    }));

    const releasedAt = new Date("2026-03-22T12:00:00.000Z");
    const released = await Effect.runPromise(repo.releaseById(created.id, releasedAt));

    expect(released).toBe(true);

    const hold = await fixture.prisma.walletHold.findUniqueOrThrow({ where: { id: created.id } });
    expect(hold.status).toBe("RELEASED");
    expect(hold.releasedAt?.toISOString()).toBe(releasedAt.toISOString());
  });

  it("forfeits a hold by id", async () => {
    const { user, rental } = await givenActiveRental(fixture, { wallet: { balance: 5000n } });
    const wallet = await fixture.prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    const created = await Effect.runPromise(repo.create({
      walletId: wallet.id,
      rentalId: rental.id,
      amount: 2000n,
      reason: "RENTAL_DEPOSIT",
    }));

    const forfeitedAt = new Date("2026-03-22T23:30:00.000Z");
    const forfeited = await Effect.runPromise(repo.forfeitById(created.id, forfeitedAt));

    expect(forfeited).toBe(true);

    const hold = await fixture.prisma.walletHold.findUniqueOrThrow({ where: { id: created.id } });
    expect(hold.status).toBe("SETTLED");
    expect(hold.settledAt?.toISOString()).toBe(forfeitedAt.toISOString());
    expect(hold.forfeitedAt?.toISOString()).toBe(forfeitedAt.toISOString());
  });

  it("findByWithdrawalId returns none when the hold does not exist", async () => {
    const result = await Effect.runPromise(repo.findByWithdrawalId(uuidv7()));

    expect(Option.isNone(result)).toBe(true);
  });
});
