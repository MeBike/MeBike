import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenActiveRental } from "@/test/scenarios";

import { createRentalDepositHoldInTx } from "../commands/rental-deposit-hold.service";
import { sweepOverdueRentals } from "../workers/rental-overdue-sweep.service";

describe("rental overdue sweep", () => {
  const fixture = setupPrismaIntFixture();

  it("moves overdue rentals to overdue and marks the bike disabled", async () => {
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
      bikeDisabled: 1,
      depositForfeited: 1,
    });

    const overdueRentalRow = await fixture.prisma.rental.findUnique({
      where: { id: overdueRental.rental.id },
    });
    expect(overdueRentalRow?.status).toBe("OVERDUE_UNRETURNED");

    const overdueBikeRow = await fixture.prisma.bike.findUnique({
      where: { id: overdueRental.bike.id },
    });
    expect(overdueBikeRow?.status).toBe("DISABLED");

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
      bikeDisabled: 0,
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

  it("cancels active return slots during overnight closure", async () => {
    const { rental, user } = await givenActiveRental(fixture, {
      rental: {
        startTime: new Date("2026-03-22T10:00:00.000Z"),
      },
    });
    const station = await fixture.factories.station({ capacity: 3 });

    await fixture.prisma.returnSlotReservation.create({
      data: {
        rentalId: rental.id,
        userId: user.id,
        stationId: station.id,
        reservedFrom: new Date("2026-03-22T15:30:00.000Z"),
        status: "ACTIVE",
      },
    });

    const summary = await sweepOverdueRentals(
      fixture.prisma,
      new Date("2026-03-22T16:05:00.000Z"),
    );

    expect(summary.cancelledReturnSlots).toBe(1);

    const slot = await fixture.prisma.returnSlotReservation.findFirst({
      where: { rentalId: rental.id },
    });
    expect(slot?.status).toBe("CANCELLED");
  });

  it("marks same-day rentals overdue and cancels return slots exactly at cutoff", async () => {
    const { rental, user, bike } = await givenActiveRental(fixture, {
      wallet: {
        balance: 1_000_000n,
      },
      rental: {
        startTime: new Date("2026-03-22T10:00:00.000Z"),
      },
    });
    const station = await fixture.factories.station({ capacity: 3 });

    await fixture.prisma.$transaction(async (tx) => {
      await Effect.runPromise(createRentalDepositHoldInTx({
        tx,
        rentalId: rental.id,
        userId: user.id,
        amount: 500_000n,
      }));
    });

    await fixture.prisma.returnSlotReservation.create({
      data: {
        rentalId: rental.id,
        userId: user.id,
        stationId: station.id,
        reservedFrom: new Date("2026-03-22T15:30:00.000Z"),
        status: "ACTIVE",
      },
    });

    const summary = await sweepOverdueRentals(
      fixture.prisma,
      new Date("2026-03-22T16:00:00.000Z"),
    );

    expect(summary).toMatchObject({
      overdue: 1,
      cancelledReturnSlots: 1,
      depositForfeited: 1,
      bikeDisabled: 1,
    });

    const rentalRow = await fixture.prisma.rental.findUnique({
      where: { id: rental.id },
    });
    expect(rentalRow?.status).toBe("OVERDUE_UNRETURNED");

    const bikeRow = await fixture.prisma.bike.findUnique({
      where: { id: bike.id },
    });
    expect(bikeRow?.status).toBe("DISABLED");

    const slot = await fixture.prisma.returnSlotReservation.findFirst({
      where: { rentalId: rental.id },
    });
    expect(slot?.status).toBe("CANCELLED");
  });

  it("cancels active return slots at the configured pricing cutoff, not only overnight window", async () => {
    await fixture.prisma.pricingPolicy.updateMany({
      data: {
        lateReturnCutoff: new Date("1970-01-01T22:00:00.000Z"),
      },
    });

    const { rental, user } = await givenActiveRental(fixture, {
      rental: {
        startTime: new Date("2026-03-22T09:00:00.000Z"),
      },
    });
    const station = await fixture.factories.station({ capacity: 3 });

    await fixture.prisma.returnSlotReservation.create({
      data: {
        rentalId: rental.id,
        userId: user.id,
        stationId: station.id,
        reservedFrom: new Date("2026-03-22T14:30:00.000Z"),
        status: "ACTIVE",
      },
    });

    const summary = await sweepOverdueRentals(
      fixture.prisma,
      new Date("2026-03-22T15:00:00.000Z"),
    );

    expect(summary.cancelledReturnSlots).toBe(1);

    const slot = await fixture.prisma.returnSlotReservation.findFirst({
      where: { rentalId: rental.id },
    });
    expect(slot?.status).toBe("CANCELLED");
  });
});
