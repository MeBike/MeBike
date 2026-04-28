import { beforeAll, describe, expect, it } from "vitest";

import { env } from "@/config/env";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { expectLeftTag, expectRight } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenStationWithAvailableBike, givenUserWithWallet } from "@/test/scenarios";

import { makeReservationRunners, makeReservationTestLayer } from "./reservation-test-kit";

describe("reservation use-cases integration", () => {
  const fixture = setupPrismaIntFixture();
  let runReserve: ReturnType<typeof makeReservationRunners>["reserve"];
  let runConfirm: ReturnType<typeof makeReservationRunners>["confirm"];
  let runCancel: ReturnType<typeof makeReservationRunners>["cancel"];

  beforeAll(() => {
    const runners = makeReservationRunners(
      makeReservationTestLayer(fixture.prisma),
    );
    runReserve = runners.reserve;
    runConfirm = runners.confirm;
    runCancel = runners.cancel;
  });

  it("reserveBikeUseCase creates hold + outbox jobs and reserves bike", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 50000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 2 },
    });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const now = new Date("2025-01-01T10:00:00.000Z");
    const startTime = new Date("2025-01-01T10:00:00.000Z");

    const result = await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime,
      now,
    });

    const reservation = expectRight(result);
    const activePricingPolicy = await fixture.prisma.pricingPolicy.findFirst({
      where: { status: "ACTIVE" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    expect(reservation.status).toBe("PENDING");
    expect(reservation.userId).toBe(user.id);
    expect(reservation.bikeId).toBe(bike.id);
    expect(reservation.stationId).toBe(station.id);
    expect(reservation.pricingPolicyId).toBe(activePricingPolicy?.id ?? null);
    expect(reservation.prepaid.toString()).toBe(activePricingPolicy?.reservationFee.toString());

    const rental = await fixture.prisma.rental.findFirst({ where: { reservationId: reservation.id } });
    expect(rental).toBeNull();

    const updatedBike = await fixture.prisma.bike.findUnique({ where: { id: bike.id } });
    expect(updatedBike?.status).toBe("RESERVED");

    const endTimeMs = startTime.getTime() + env.RESERVATION_HOLD_MINUTES * 60 * 1000;
    const notifyAtMs = endTimeMs - env.EXPIRY_NOTIFY_MINUTES * 60 * 1000;

    const outbox = await fixture.prisma.jobOutbox.findMany({
      where: { dedupeKey: { contains: reservation.id } },
      orderBy: { createdAt: "asc" },
    });
    const types = outbox.map(row => row.type).sort();
    expect(types).toEqual([
      JobTypes.EmailSend,
      JobTypes.ReservationExpireHold,
      JobTypes.ReservationNotifyNearExpiry,
    ].sort());

    const notifyJob = outbox.find(row => row.type === JobTypes.ReservationNotifyNearExpiry);
    const expireJob = outbox.find(row => row.type === JobTypes.ReservationExpireHold);
    const emailJob = outbox.find(row => row.type === JobTypes.EmailSend);

    expect(notifyJob?.runAt.getTime()).toBe(Math.max(now.getTime(), notifyAtMs));
    expect(expireJob?.runAt.getTime()).toBe(Math.max(now.getTime(), endTimeMs));
    expect(emailJob?.dedupeKey).toBe(`reservation-confirm:${reservation.id}`);
    expect(emailJob?.payload).toMatchObject({
      kind: "raw",
      to: user.email,
    });
  });

  it("confirmReservationUseCase fulfills reservation, creates rental, and books bike", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 600000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 2 },
    });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const now = new Date("2025-01-01T12:00:00.000Z");

    const reserveResult = await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: now,
      now,
    });

    const reservation = expectRight(reserveResult);

    const confirmResult = await runConfirm({
      reservationId: reservation.id,
      userId: user.id,
      now,
    });

    expectRight(confirmResult);

    const activePricingPolicy = await fixture.prisma.pricingPolicy.findFirst({
      where: { status: "ACTIVE" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    const updatedReservation = await fixture.prisma.reservation.findUnique({ where: { id: reservation.id } });
    expect(updatedReservation?.status).toBe("FULFILLED");

    const rental = await fixture.prisma.rental.findFirst({ where: { reservationId: reservation.id } });
    expect(rental?.status).toBe("RENTED");
    expect(rental?.reservationId).toBe(reservation.id);
    expect(rental?.bikeId).toBe(bike.id);
    expect(rental?.pricingPolicyId).toBe(reservation.pricingPolicyId);
    expect(rental?.depositHoldId).not.toBeNull();

    const depositHold = await fixture.prisma.walletHold.findUnique({
      where: { id: rental!.depositHoldId! },
    });
    expect(depositHold?.reason).toBe("RENTAL_DEPOSIT");
    expect(depositHold?.rentalId).toBe(rental?.id);

    const wallet = await fixture.prisma.wallet.findUnique({ where: { userId: user.id } });
    expect(wallet?.reservedBalance.toString()).toBe(activePricingPolicy?.depositRequired.toString());

    const updatedBike = await fixture.prisma.bike.findUnique({ where: { id: bike.id } });
    expect(updatedBike?.status).toBe("BOOKED");
  });

  it("cancelReservationUseCase cancels hold, releases bike, and refunds prepaid amount", async () => {
    const initialBalance = 50000n;
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: initialBalance },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 2 },
    });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const now = new Date("2025-01-01T13:00:00.000Z");

    const reserveResult = await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: now,
      now,
    });

    const reservation = expectRight(reserveResult);

    const cancelResult = await runCancel({
      reservationId: reservation.id,
      userId: user.id,
      now,
    });

    expectRight(cancelResult);

    const updatedReservation = await fixture.prisma.reservation.findUnique({ where: { id: reservation.id } });
    expect(updatedReservation?.status).toBe("CANCELLED");

    const rental = await fixture.prisma.rental.findFirst({ where: { reservationId: reservation.id } });
    expect(rental).toBeNull();

    const updatedBike = await fixture.prisma.bike.findUnique({ where: { id: bike.id } });
    expect(updatedBike?.status).toBe("AVAILABLE");

    const wallet = await fixture.prisma.wallet.findUnique({ where: { userId: user.id } });
    expect(wallet?.balance).toBe(initialBalance);

    const refundTx = await fixture.prisma.walletTransaction.findFirst({
      where: { hash: `refund:reservation:${reservation.id}` },
    });
    expect(refundTx).not.toBeNull();
  });

  it("reserveBikeUseCase fails with BikeAlreadyReserved when bike status is reserved", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 50000n },
    });
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id, status: "RESERVED" });

    const now = new Date("2025-01-01T10:00:00.000Z");
    const result = await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: now,
      now,
    });

    expectLeftTag(result, "BikeAlreadyReserved");
  });

  it.each([
    { status: "REDISTRIBUTING", tag: "BikeIsRedistributing" },
    { status: "LOST", tag: "BikeIsLost" },
    { status: "DISABLED", tag: "BikeIsDisabled" },
  ] as const)("reserveBikeUseCase fails when bike status is $status", async ({ status, tag }) => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 50000n },
    });
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id, status });

    const now = new Date("2025-01-01T10:00:00.000Z");
    const result = await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: now,
      now,
    });

    expectLeftTag(result, tag);
  });

  it("reserveBikeUseCase rejects during overnight closure", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 50000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 2 },
    });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const blockedNow = new Date("2026-04-20T16:00:00.000Z");
    const result = await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: blockedNow,
      now: blockedNow,
    });

    expectLeftTag(result, "OvernightOperationsClosed");
  });

  it("confirmReservationUseCase rejects during overnight closure", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 600000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 2 },
    });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const allowedNow = new Date("2026-04-20T10:00:00.000Z");
    const reserveResult = await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: allowedNow,
      now: allowedNow,
    });
    const reservation = expectRight(reserveResult);

    const blockedNow = new Date("2026-04-20T16:00:00.000Z");
    const confirmResult = await runConfirm({
      reservationId: reservation.id,
      userId: user.id,
      now: blockedNow,
    });

    expectLeftTag(confirmResult, "OvernightOperationsClosed");
  });
});
