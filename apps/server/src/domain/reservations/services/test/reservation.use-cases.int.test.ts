import { beforeAll, describe, expect, it } from "vitest";

import { env } from "@/config/env";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { expectLeftTag, expectRight } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenStationWithAvailableBike, givenUserWithWallet } from "@/test/scenarios";

import { makeReservationUseCaseRunners, makeReservationUseCaseTestLayer } from "./reservation-test-kit";

describe("reservation use-cases integration", () => {
  const fixture = setupPrismaIntFixture();
  let runReserve: ReturnType<typeof makeReservationUseCaseRunners>["reserve"];
  let runConfirm: ReturnType<typeof makeReservationUseCaseRunners>["confirm"];
  let runCancel: ReturnType<typeof makeReservationUseCaseRunners>["cancel"];

  beforeAll(() => {
    const runners = makeReservationUseCaseRunners(
      makeReservationUseCaseTestLayer(fixture.prisma),
    );
    runReserve = runners.reserve;
    runConfirm = runners.confirm;
    runCancel = runners.cancel;
  });

  it("reserveBikeUseCase creates hold + outbox jobs and reserves bike", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 50000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture);

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
    expect(reservation.status).toBe("PENDING");
    expect(reservation.userId).toBe(user.id);
    expect(reservation.bikeId).toBe(bike.id);
    expect(reservation.stationId).toBe(station.id);

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
      wallet: { balance: 50000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture);

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

    const updatedReservation = await fixture.prisma.reservation.findUnique({ where: { id: reservation.id } });
    expect(updatedReservation?.status).toBe("FULFILLED");

    const rental = await fixture.prisma.rental.findFirst({ where: { reservationId: reservation.id } });
    expect(rental?.status).toBe("RENTED");
    expect(rental?.reservationId).toBe(reservation.id);
    expect(rental?.bikeId).toBe(bike.id);

    const updatedBike = await fixture.prisma.bike.findUnique({ where: { id: bike.id } });
    expect(updatedBike?.status).toBe("BOOKED");
  });

  it("cancelReservationUseCase cancels hold, releases bike, and refunds prepaid amount", async () => {
    const initialBalance = 50000n;
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: initialBalance },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture);

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

  it("reserveBikeUseCase fails when bike is already reserved", async () => {
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

    expectLeftTag(result, "BikeNotAvailable");
  });
});
