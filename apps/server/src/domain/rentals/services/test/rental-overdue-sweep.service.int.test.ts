import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenActiveRental } from "@/test/scenarios";

import { createRentalDepositHoldInTx } from "../commands/rental-deposit-hold.service";
import { sweepOverdueRentals } from "../workers/rental-overdue-sweep.service";

describe("rental overdue sweep", () => {
  const fixture = setupPrismaIntFixture();

  it("moves overdue rentals to overdue and marks the bike unavailable", async () => {
    const overdueRental = await givenActiveRental(fixture, {
      wallet: {
        balance: 1_000_000n,
      },
      rental: {
        startTime: new Date("2026-03-21T10:00:00.000Z"),
      },
    });

    await fixture.prisma.$transaction(async (tx) => {
      await Effect.runPromise(createRentalDepositHoldInTx({
        tx,
        rentalId: overdueRental.rental.id,
        userId: overdueRental.user.id,
        amount: 500_000n,
      }));
    });

    const stillActiveRental = await givenActiveRental(fixture, {
      rental: {
        startTime: new Date("2026-03-22T14:00:00.000Z"),
      },
    });

    const summary = await sweepOverdueRentals(
      fixture.prisma,
      new Date("2026-03-22T14:05:00.000Z"),
    );

    expect(summary).toMatchObject({
      scanned: 1,
      overdue: 1,
      skipped: 0,
      failed: 0,
      bikeUnavailable: 1,
      depositForfeited: 1,
    });

    const overdueRentalRow = await fixture.prisma.rental.findUnique({
      where: { id: overdueRental.rental.id },
    });
    expect(overdueRentalRow?.status).toBe("OVERDUE_UNRETURNED");

    const overdueBikeRow = await fixture.prisma.bike.findUnique({
      where: { id: overdueRental.bike.id },
    });
    expect(overdueBikeRow?.status).toBe("UNAVAILABLE");

    const forfeitedHold = await fixture.prisma.walletHold.findFirst({
      where: { rentalId: overdueRental.rental.id },
    });
    expect(forfeitedHold?.status).toBe("SETTLED");
    expect(forfeitedHold?.forfeitedAt?.toISOString()).toBe("2026-03-22T14:05:00.000Z");

    const overdueWalletRow = await fixture.prisma.wallet.findUnique({
      where: { userId: overdueRental.user.id },
    });
    expect(overdueWalletRow?.reservedBalance.toString()).toBe("0");
    expect(overdueWalletRow?.balance.toString()).toBe("500000");

    const stillActiveRentalRow = await fixture.prisma.rental.findUnique({
      where: { id: stillActiveRental.rental.id },
    });
    expect(stillActiveRentalRow?.status).toBe("RENTED");

    const stillActiveBikeRow = await fixture.prisma.bike.findUnique({
      where: { id: stillActiveRental.bike.id },
    });
    expect(stillActiveBikeRow?.status).toBe("BOOKED");
  });

  it("rolls back the overdue transition when deposit forfeiture fails", async () => {
    const overdueRental = await givenActiveRental(fixture, {
      wallet: {
        balance: 500_000n,
      },
      rental: {
        startTime: new Date("2026-03-21T10:00:00.000Z"),
      },
    });

    await fixture.prisma.$transaction(async (tx) => {
      await Effect.runPromise(createRentalDepositHoldInTx({
        tx,
        rentalId: overdueRental.rental.id,
        userId: overdueRental.user.id,
        amount: 500_000n,
      }));
    });

    await fixture.prisma.wallet.update({
      where: { userId: overdueRental.user.id },
      data: {
        balance: 0n,
      },
    });

    const summary = await sweepOverdueRentals(
      fixture.prisma,
      new Date("2026-03-22T14:05:00.000Z"),
    );

    expect(summary).toMatchObject({
      scanned: 1,
      overdue: 0,
      skipped: 0,
      failed: 1,
      bikeUnavailable: 0,
      depositForfeited: 0,
    });

    const rentalRow = await fixture.prisma.rental.findUnique({
      where: { id: overdueRental.rental.id },
    });
    expect(rentalRow?.status).toBe("RENTED");

    const bikeRow = await fixture.prisma.bike.findUnique({
      where: { id: overdueRental.bike.id },
    });
    expect(bikeRow?.status).toBe("BOOKED");

    const holdRow = await fixture.prisma.walletHold.findFirst({
      where: { rentalId: overdueRental.rental.id },
    });
    expect(holdRow?.status).toBe("ACTIVE");
    expect(holdRow?.forfeitedAt).toBeNull();
  });
});
