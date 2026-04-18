import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import process from "node:process";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { JobProducer, QueueJob } from "@/infrastructure/jobs/ports";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import {
  handleReservationExpireHold,
  handleReservationNotifyNearExpiry,
} from "@/worker/reservation-hold-worker";

function makeBossMock(): {
  readonly producer: JobProducer;
  readonly send: ReturnType<typeof vi.fn>;
} {
  const send = vi.fn(async () => "mock-job-id");
  return {
    producer: { send } as JobProducer,
    send,
  };
}

function makeReservationJob(reservationId: string): QueueJob {
  return {
    id: `job-${reservationId}`,
    data: {
      version: 1,
      reservationId,
    },
  };
}

async function createStation(fixture: ReturnType<typeof setupPrismaIntFixture>, input: {
  name: string;
  address: string;
  capacity: number;
  latitude: number;
  longitude: number;
}) {
  return fixture.factories.station(input);
}

describe("reservation hold worker integration", () => {
  const fixture = setupPrismaIntFixture();

  beforeAll(() => {
    process.env.TEST_DATABASE_URL = fixture.url;
  });

  it("enqueues push job for near-expiry reservation", async () => {
    const user = await fixture.factories.user({
      fullname: "Near Expiry User",
      email: "near-expiry-user@example.com",
    });
    const station = await createStation(fixture, {
      name: "Near Expiry Station",
      address: "District 2",
      capacity: 20,
      latitude: 10.779783,
      longitude: 106.699018,
    });
    const bike = await fixture.factories.bike({
      stationId: station.id,
      status: "RESERVED",
    });
    const reservation = await fixture.prisma.reservation.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        bikeId: bike.id,
        stationId: station.id,
        reservationOption: "ONE_TIME",
        startTime: new Date(Date.now() - 5 * 60 * 1000),
        endTime: new Date(Date.now() + 10 * 60 * 1000),
        status: "PENDING",
      },
    });

    const { producer, send } = makeBossMock();
    await handleReservationNotifyNearExpiry(
      makeReservationJob(reservation.id),
      producer,
    );

    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenNthCalledWith(
      2,
      JobTypes.PushSend,
      expect.objectContaining({
        version: 1,
        userId: user.id,
        event: "reservations.nearExpiry",
        channelId: "default",
        data: expect.objectContaining({
          reservationId: reservation.id,
          event: "reservations.nearExpiry",
        }),
      }),
      expect.objectContaining({
        dedupeKey: `reservation:near-expiry:push:${reservation.id}`,
      }),
    );
  });

  it("expires hold and enqueues expired push job", async () => {
    const user = await fixture.factories.user({
      fullname: "Expired User",
      email: "expired-user@example.com",
    });
    const station = await createStation(fixture, {
      name: "Expired Station",
      address: "District 1",
      capacity: 15,
      latitude: 10.775658,
      longitude: 106.700424,
    });
    const bike = await fixture.factories.bike({
      stationId: station.id,
      status: "RESERVED",
    });
    const reservation = await fixture.prisma.reservation.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        bikeId: bike.id,
        stationId: station.id,
        reservationOption: "ONE_TIME",
        startTime: new Date(Date.now() - 60 * 60 * 1000),
        endTime: new Date(Date.now() - 10 * 60 * 1000),
        status: "PENDING",
      },
    });
    const { producer, send } = makeBossMock();
    await handleReservationExpireHold(
      makeReservationJob(reservation.id),
      producer,
    );

    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenNthCalledWith(
      2,
      JobTypes.PushSend,
      expect.objectContaining({
        version: 1,
        userId: user.id,
        event: "reservations.expired",
        channelId: "default",
        data: expect.objectContaining({
          reservationId: reservation.id,
          event: "reservations.expired",
        }),
      }),
      expect.objectContaining({
        dedupeKey: `reservation:expired:push:${reservation.id}`,
      }),
    );

    const [reservationAfter, rentalAfter, bikeAfter] = await Promise.all([
      fixture.prisma.reservation.findUnique({
        where: { id: reservation.id },
        select: { status: true },
      }),
      fixture.prisma.rental.findFirst({
        where: { reservationId: reservation.id },
        select: { status: true },
      }),
      fixture.prisma.bike.findUnique({
        where: { id: bike.id },
        select: { status: true },
      }),
    ]);

    expect(reservationAfter?.status).toBe("EXPIRED");
    expect(rentalAfter).toBeNull();
    expect(bikeAfter?.status).toBe("AVAILABLE");
  });
});
