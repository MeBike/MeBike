import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import { PrismaPg } from "@prisma/adapter-pg";
import { uuidv7 } from "uuidv7";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { JobProducer, QueueJob } from "@/infrastructure/jobs/ports";

import { getTestDatabase } from "@/test/db/test-database";
import {
  handleReservationExpireHold,
  handleReservationNotifyNearExpiry,
} from "@/worker/reservation-hold-worker";
import { PrismaClient } from "generated/prisma/client";

type TestContainer = { stop: () => Promise<void>; url: string };

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

async function createStation(client: PrismaClient, input: {
  id: string;
  name: string;
  address: string;
  capacity: number;
  latitude: number;
  longitude: number;
}) {
  await client.$executeRaw`
    INSERT INTO "Station" (id, name, address, capacity, latitude, longitude, updated_at, position)
    VALUES (
      ${input.id},
      ${input.name},
      ${input.address},
      ${input.capacity},
      ${input.latitude},
      ${input.longitude},
      ${new Date()},
      ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography
    )
  `;
}

describe("reservation hold worker integration", () => {
  let container: TestContainer;
  let client: PrismaClient;

  beforeAll(async () => {
    container = await getTestDatabase();
    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
  }, 60000);

  beforeEach(async () => {
    await client.rental.deleteMany({});
    await client.reservation.deleteMany({});
    await client.bike.deleteMany({});
    await client.station.deleteMany({});
    await client.user.deleteMany({});
  });

  afterAll(async () => {
    if (client) {
      await client.$disconnect();
    }
    if (container) {
      await container.stop();
    }
  });

  it("enqueues push job for near-expiry reservation", async () => {
    const user = await client.user.create({
      data: {
        fullname: "Near Expiry User",
        email: "near-expiry-user@example.com",
        passwordHash: "hash",
      },
    });
    const stationId = uuidv7();
    await createStation(client, {
      id: stationId,
      name: "Near Expiry Station",
      address: "District 2",
      capacity: 20,
      latitude: 10.779783,
      longitude: 106.699018,
    });
    const bike = await client.bike.create({
      data: {
        chipId: "bike-near-expiry",
        stationId,
        status: "RESERVED",
        updatedAt: new Date(),
      },
    });
    const reservation = await client.reservation.create({
      data: {
        userId: user.id,
        bikeId: bike.id,
        stationId,
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
    const user = await client.user.create({
      data: {
        fullname: "Expired User",
        email: "expired-user@example.com",
        passwordHash: "hash",
      },
    });
    const stationId = uuidv7();
    await createStation(client, {
      id: stationId,
      name: "Expired Station",
      address: "District 1",
      capacity: 15,
      latitude: 10.775658,
      longitude: 106.700424,
    });
    const bike = await client.bike.create({
      data: {
        chipId: "bike-expired-hold",
        stationId,
        status: "RESERVED",
        updatedAt: new Date(),
      },
    });
    const reservation = await client.reservation.create({
      data: {
        userId: user.id,
        bikeId: bike.id,
        stationId,
        reservationOption: "ONE_TIME",
        startTime: new Date(Date.now() - 60 * 60 * 1000),
        endTime: new Date(Date.now() - 10 * 60 * 1000),
        status: "PENDING",
      },
    });
    await client.rental.create({
      data: {
        id: reservation.id,
        userId: user.id,
        bikeId: bike.id,
        startStationId: stationId,
        startTime: reservation.startTime,
        status: "RESERVED",
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
      client.reservation.findUnique({
        where: { id: reservation.id },
        select: { status: true },
      }),
      client.rental.findUnique({
        where: { id: reservation.id },
        select: { status: true },
      }),
      client.bike.findUnique({
        where: { id: bike.id },
        select: { status: true },
      }),
    ]);

    expect(reservationAfter?.status).toBe("EXPIRED");
    expect(rentalAfter?.status).toBe("CANCELLED");
    expect(bikeAfter?.status).toBe("AVAILABLE");
  });
});
