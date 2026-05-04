import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import { Effect, Layer } from "effect";
import process from "node:process";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { BikeRepository } from "@/domain/bikes";
import type { ReservationQueryRepository } from "@/domain/reservations";
import type { StationQueryRepository } from "@/domain/stations/repository/station-query.repository";
import type { UserQueryRepository } from "@/domain/users/repository/user-query.repository";
import type { JobProducer, QueueJob } from "@/infrastructure/jobs/ports";
import type { EffectRunner } from "@/worker/worker-runtime";

import { BikeRepositoryLive } from "@/domain/bikes";
import { ReservationQueryRepositoryLive } from "@/domain/reservations";
import { StationQueryRepositoryLive } from "@/domain/stations/repository/station-query.repository";
import { UserQueryRepositoryLive } from "@/domain/users/repository/user-query.repository";
import { Prisma } from "@/infrastructure/prisma";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import {
  makeReservationExpireHoldHandler,
  makeReservationNotifyNearExpiryHandler,
} from "@/worker/reservation-hold/index";

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

  function makeRunEffect(): EffectRunner<
    Prisma | BikeRepository | ReservationQueryRepository | StationQueryRepository | UserQueryRepository
  > {
    const PrismaTestLive = Layer.succeed(Prisma, Prisma.make({ client: fixture.prisma }));
    const TestLive = Layer.mergeAll(
      PrismaTestLive,
      BikeRepositoryLive.pipe(Layer.provide(PrismaTestLive)),
      ReservationQueryRepositoryLive.pipe(Layer.provide(PrismaTestLive)),
      StationQueryRepositoryLive.pipe(Layer.provide(PrismaTestLive)),
      UserQueryRepositoryLive.pipe(Layer.provide(PrismaTestLive)),
    );
    return effect => Effect.runPromise(effect.pipe(Effect.provide(TestLive)));
  }

  beforeAll(() => {
    process.env.TEST_DATABASE_URL = fixture.url;
  });

  it("enqueues near-expiry email job", async () => {
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
    const handler = makeReservationNotifyNearExpiryHandler(makeRunEffect(), producer);
    await handler(makeReservationJob(reservation.id));

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenNthCalledWith(
      1,
      JobTypes.EmailSend,
      expect.objectContaining({
        version: 1,
        kind: "raw",
        to: user.email,
      }),
      expect.objectContaining({
        dedupeKey: `reservation:near-expiry:${reservation.id}`,
      }),
    );
  });

  it("expires hold and enqueues expired email job", async () => {
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
    const handler = makeReservationExpireHoldHandler(makeRunEffect(), producer);
    await handler(makeReservationJob(reservation.id));

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenNthCalledWith(
      1,
      JobTypes.EmailSend,
      expect.objectContaining({
        version: 1,
        kind: "raw",
        to: user.email,
      }),
      expect.objectContaining({
        dedupeKey: `reservation:expired:${reservation.id}`,
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

  it("expires fixed-slot hold and releases bike after claim window", async () => {
    const user = await fixture.factories.user({
      fullname: "Expired Fixed Slot User",
      email: "expired-fixed-slot-user@example.com",
    });
    const station = await createStation(fixture, {
      name: "Expired Fixed Slot Station",
      address: "District 3",
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
        reservationOption: "FIXED_SLOT",
        startTime: new Date(Date.now() - 60 * 60 * 1000),
        endTime: new Date(Date.now() - 10 * 60 * 1000),
        status: "PENDING",
      },
    });

    const { producer, send } = makeBossMock();
    const handler = makeReservationExpireHoldHandler(makeRunEffect(), producer);
    await handler(makeReservationJob(reservation.id));

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenNthCalledWith(
      1,
      JobTypes.EmailSend,
      expect.objectContaining({
        version: 1,
        kind: "raw",
        to: user.email,
      }),
      expect.objectContaining({
        dedupeKey: `reservation:expired:${reservation.id}`,
      }),
    );

    const [reservationAfter, bikeAfter] = await Promise.all([
      fixture.prisma.reservation.findUnique({
        where: { id: reservation.id },
        select: { status: true },
      }),
      fixture.prisma.bike.findUnique({
        where: { id: bike.id },
        select: { status: true },
      }),
    ]);

    expect(reservationAfter?.status).toBe("EXPIRED");
    expect(bikeAfter?.status).toBe("AVAILABLE");
  });
});
