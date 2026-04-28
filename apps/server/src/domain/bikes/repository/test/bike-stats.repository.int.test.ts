import { Effect, Either } from "effect";
import { beforeAll, describe, expect, it } from "vitest";

import { destroyTestDb, makeTestDb } from "@/test/db/kysely";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeBikeStatsRepository } from "../bike-stats.repository";

describe("bikeStatsRepository Integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeBikeStatsRepository>;

  beforeAll(() => {
    repo = makeBikeStatsRepository(fixture.db);
  });

  const createUser = async () => {
    const user = await fixture.factories.user({
      fullname: "Stats User",
    });
    return { id: user.id };
  };

  const createStation = async (name: string) => {
    return fixture.factories.station({ name, latitude: 10.0, longitude: 20.0 });
  };

  const createBike = async (stationId: string, status: "AVAILABLE" | "BOOKED" | "DISABLED") => {
    return fixture.factories.bike({ stationId, status });
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
    await fixture.factories.rental({
      userId: input.userId,
      bikeId: input.bikeId,
      startStationId: input.startStationId,
      endStationId: input.endStationId,
      startTime: input.startTime,
      endTime: input.endTime,
      duration: input.duration,
      totalPrice: input.totalPrice,
      status: "COMPLETED",
    });
  };

  it("getRentalStats returns totals and percentage", async () => {
    const { id: stationId } = await createStation("Stats Station");
    await createBike(stationId, "BOOKED");
    await createBike(stationId, "AVAILABLE");
    await createBike(stationId, "DISABLED");

    const result = await Effect.runPromise(repo.getRentalStats());
    expect(result.totalActiveBikes).toBe(2);
    expect(result.rentedBikes).toBe(1);
    expect(result.percentage).toBe(50);
  });

  it("getBikeStatistics returns status counts", async () => {
    const { id: stationId } = await createStation("Status Station");
    await createBike(stationId, "AVAILABLE");
    await createBike(stationId, "BOOKED");
    await createBike(stationId, "DISABLED");

    const result = await Effect.runPromise(repo.getBikeStatistics());
    expect(result.AVAILABLE).toBe(1);
    expect(result.RENTED).toBe(1);
    expect(result.DISABLED).toBe(1);
    expect(result.RESERVED).toBe(0);
    expect(result.BROKEN).toBe(0);
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

  it("getBikeStatsById returns aggregate totals for a bike", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation("Bike Summary Station");
    const { id: bikeId } = await createBike(stationId, "AVAILABLE");

    await createRental({
      userId,
      bikeId,
      startStationId: stationId,
      endStationId: stationId,
      startTime: new Date("2024-03-01T08:00:00Z"),
      endTime: new Date("2024-03-01T08:30:00Z"),
      duration: 30,
      totalPrice: "25",
    });
    await createRental({
      userId,
      bikeId,
      startStationId: stationId,
      endStationId: stationId,
      startTime: new Date("2024-03-02T08:00:00Z"),
      endTime: new Date("2024-03-02T09:00:00Z"),
      duration: 60,
      totalPrice: "75",
    });

    const result = await Effect.runPromise(repo.getBikeStatsById(bikeId));
    expect(result.id).toBe(bikeId);
    expect(result.totalRentals).toBe(2);
    expect(result.totalRevenue).toBe(100);
    expect(result.totalDurationMinutes).toBe(90);
    expect(result.totalReports).toBe(0);
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
    try {
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
    }
    finally {
      await destroyTestDb(invalidDb);
    }
  });
});
