import type { Kysely } from "kysely";

import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { DB } from "generated/kysely/types";

import { destroyTestDb, makeTestDb } from "@/test/db/kysely";
import { migrate } from "@/test/db/migrate";
import { startPostgres } from "@/test/db/postgres";
import { PrismaClient } from "generated/prisma/client";

import { makeBikeStatsRepository } from "../bike-stats.repository";

describe("bikeStatsRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let testDb: Kysely<DB>;
  let repo: ReturnType<typeof makeBikeStatsRepository>;

  beforeAll(async () => {
    container = await startPostgres();
    await migrate(container.url);

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });

    testDb = makeTestDb(container.url);
    repo = makeBikeStatsRepository(testDb);
  }, 60000);

  afterEach(async () => {
    await client.rental.deleteMany({});
    await client.bike.deleteMany({});
    await client.station.deleteMany({});
    await client.user.deleteMany({});
  });

  afterAll(async () => {
    if (client)
      await client.$disconnect();
    if (testDb)
      await destroyTestDb(testDb);
    if (container)
      await container.stop();
  });

  const createUser = async () => {
    const id = uuidv7();
    await client.user.create({
      data: {
        id,
        fullname: "Stats User",
        email: `user-${id}@example.com`,
        passwordHash: "hash",
        role: "USER",
        verify: "VERIFIED",
      },
    });
    return { id };
  };

  const createStation = async (name: string) => {
    const id = uuidv7();
    const address = "123 Test St";
    const capacity = 10;
    const latitude = 10.0;
    const longitude = 20.0;
    const updatedAt = new Date();

    await client.$executeRaw`
      INSERT INTO "Station" (
        "id",
        "name",
        "address",
        "capacity",
        "latitude",
        "longitude",
        "updated_at",
        "position"
      ) VALUES (
        ${id},
        ${name},
        ${address},
        ${capacity},
        ${latitude},
        ${longitude},
        ${updatedAt},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      )
    `;

    return { id };
  };

  const createBike = async (stationId: string, status: "AVAILABLE" | "BOOKED" | "UNAVAILABLE") => {
    const id = uuidv7();
    await client.bike.create({
      data: {
        id,
        chipId: `chip-${id}`,
        stationId,
        supplierId: null,
        status,
        updatedAt: new Date(),
      },
    });
    return { id };
  };

  const createRental = async (input: {
    userId: string;
    bikeId: string;
    startStationId: string;
    endStationId: string | null;
    startTime: Date;
    endTime: Date;
    duration: number;
    totalPrice: string;
  }) => {
    await client.rental.create({
      data: {
        id: uuidv7(),
        userId: input.userId,
        bikeId: input.bikeId,
        startStationId: input.startStationId,
        endStationId: input.endStationId,
        startTime: input.startTime,
        endTime: input.endTime,
        duration: input.duration,
        totalPrice: input.totalPrice,
        status: "COMPLETED",
        updatedAt: input.endTime,
      },
    });
  };

  it("getRentalStats returns totals and percentage", async () => {
    const { id: stationId } = await createStation("Stats Station");
    await createBike(stationId, "BOOKED");
    await createBike(stationId, "AVAILABLE");
    await createBike(stationId, "UNAVAILABLE");

    const result = await Effect.runPromise(repo.getRentalStats());
    expect(result.totalActiveBikes).toBe(2);
    expect(result.rentedBikes).toBe(1);
    expect(result.percentage).toBe(50);
  });

  it("getHighestRevenueBike returns top bike", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation("Revenue Station");
    const { id: bikeA } = await createBike(stationId, "AVAILABLE");
    const { id: bikeB } = await createBike(stationId, "AVAILABLE");

    await createRental({
      userId,
      bikeId: bikeA,
      startStationId: stationId,
      endStationId: stationId,
      startTime: new Date("2024-01-10T10:00:00Z"),
      endTime: new Date("2024-01-10T11:00:00Z"),
      duration: 60,
      totalPrice: "100",
    });
    await createRental({
      userId,
      bikeId: bikeA,
      startStationId: stationId,
      endStationId: stationId,
      startTime: new Date("2024-02-10T10:00:00Z"),
      endTime: new Date("2024-02-10T10:30:00Z"),
      duration: 30,
      totalPrice: "50",
    });
    await createRental({
      userId,
      bikeId: bikeB,
      startStationId: stationId,
      endStationId: stationId,
      startTime: new Date("2024-02-11T10:00:00Z"),
      endTime: new Date("2024-02-11T10:10:00Z"),
      duration: 10,
      totalPrice: "20",
    });

    const result = await Effect.runPromise(repo.getHighestRevenueBike());
    expect(result?.bikeId).toBe(bikeA);
    expect(result?.totalRevenue).toBe(150);
    expect(result?.rentalCount).toBe(2);
  });

  it("getBikeActivityStats returns totals and monthly stats", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation("Activity Station");
    const { id: bikeId } = await createBike(stationId, "AVAILABLE");

    await createRental({
      userId,
      bikeId,
      startStationId: stationId,
      endStationId: stationId,
      startTime: new Date("2024-01-10T10:00:00Z"),
      endTime: new Date("2024-01-10T11:00:00Z"),
      duration: 60,
      totalPrice: "100",
    });
    await createRental({
      userId,
      bikeId,
      startStationId: stationId,
      endStationId: stationId,
      startTime: new Date("2024-02-10T10:00:00Z"),
      endTime: new Date("2024-02-10T10:30:00Z"),
      duration: 30,
      totalPrice: "50",
    });

    const result = await Effect.runPromise(
      repo.getBikeActivityStats({
        bikeId,
        now: new Date("2024-02-15T00:00:00Z"),
        months: 2,
      }),
    );

    expect(result.totalMinutesActive).toBe(90);
    expect(result.totalRevenue).toBe(150);
    expect(result.monthly).toHaveLength(2);
  });

  it("getBikeRentalHistory returns history items", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation("History Station");
    const { id: bikeId } = await createBike(stationId, "AVAILABLE");

    await createRental({
      userId,
      bikeId,
      startStationId: stationId,
      endStationId: stationId,
      startTime: new Date("2024-02-10T10:00:00Z"),
      endTime: new Date("2024-02-10T10:30:00Z"),
      duration: 30,
      totalPrice: "50",
    });

    const result = await Effect.runPromise(
      repo.getBikeRentalHistory(bikeId, { page: 1, pageSize: 10 }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].user.fullname).toBe("Stats User");
    expect(result.total).toBe(1);
  });

  it("returns BikeRepositoryError when DB is unreachable", async () => {
    const invalidDb = makeTestDb(
      "postgresql://invalid:invalid@localhost:54321/invalid",
      { connectionTimeoutMillis: 100 },
    );
    const brokenRepo = makeBikeStatsRepository(invalidDb);

    const result = await Effect.runPromise(
      brokenRepo.getRentalStats().pipe(Effect.either),
    );

    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("BikeRepositoryError");
      expect(result.left.operation).toBe("stats.rentalStats");
    }
    else {
      throw new Error("Expected failure but got success");
    }

    await destroyTestDb(invalidDb);
  });
});
