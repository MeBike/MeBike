import { PrismaPg } from "@prisma/adapter-pg";
import { Effect } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getTestDatabase } from "@/test/db/test-database";
import { PrismaClient } from "generated/prisma/client";

import { makeRentalAnalyticsRepository } from "../rental-analytics.repository";

describe("rentalAnalyticsRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeRentalAnalyticsRepository>;

  beforeAll(async () => {
    container = await getTestDatabase();

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    repo = makeRentalAnalyticsRepository(client);
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
    if (container)
      await container.stop();
  });

  const createUser = async () => {
    const id = uuidv7();
    await client.user.create({
      data: {
        id,
        fullname: "Analytics User",
        email: `analytics-${id}@example.com`,
        passwordHash: "hash",
        role: "USER",
        verify: "VERIFIED",
      },
    });
    return { id };
  };

  const createStation = async () => {
    const id = uuidv7();
    const name = `Station ${id}`;
    const address = "123 Test St";
    const capacity = 10;
    const latitude = 10.762622;
    const longitude = 106.660172;
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

  const createBike = async (stationId: string) => {
    const id = uuidv7();
    await client.bike.create({
      data: {
        id,
        chipId: `chip-${id}`,
        stationId,
        supplierId: null,
        status: "AVAILABLE",
        updatedAt: new Date(),
      },
    });
    return { id };
  };

  const createRental = async (args: {
    userId: string;
    bikeId: string;
    stationId: string;
    status: "RENTED" | "COMPLETED" | "CANCELLED" | "RESERVED";
    startTime: Date;
    endTime?: Date | null;
    totalPrice?: number | null;
  }) => {
    await client.rental.create({
      data: {
        id: uuidv7(),
        userId: args.userId,
        bikeId: args.bikeId,
        startStationId: args.stationId,
        endStationId: args.endTime ? args.stationId : null,
        startTime: args.startTime,
        endTime: args.endTime ?? null,
        duration: args.endTime
          ? Math.floor((args.endTime.getTime() - args.startTime.getTime()) / 60000)
          : null,
        totalPrice: args.totalPrice ?? null,
        status: args.status,
        updatedAt: new Date(),
      },
    });
  };

  it("getGlobalRentalCounts returns aggregated counts by status", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId);
    const now = new Date("2026-03-16T10:00:00.000Z");

    await createRental({
      userId,
      bikeId,
      stationId,
      status: "RENTED",
      startTime: now,
    });
    await createRental({
      userId,
      bikeId,
      stationId,
      status: "RESERVED",
      startTime: now,
    });
    await createRental({
      userId,
      bikeId,
      stationId,
      status: "CANCELLED",
      startTime: now,
    });
    await createRental({
      userId,
      bikeId,
      stationId,
      status: "COMPLETED",
      startTime: now,
      endTime: new Date("2026-03-16T11:00:00.000Z"),
      totalPrice: 10000,
    });

    const rows = await Effect.runPromise(repo.getGlobalRentalCounts());
    const byStatus = new Map(rows.map(row => [row.status, row.count]));

    expect(byStatus.get("RENTED")).toBe(1);
    expect(byStatus.get("RESERVED")).toBe(1);
    expect(byStatus.get("CANCELLED")).toBe(1);
    expect(byStatus.get("COMPLETED")).toBe(1);
  });

  it("completed totals only include completed rentals in range", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId);

    await createRental({
      userId,
      bikeId,
      stationId,
      status: "COMPLETED",
      startTime: new Date("2026-03-15T08:00:00.000Z"),
      endTime: new Date("2026-03-15T09:00:00.000Z"),
      totalPrice: 12000,
    });
    await createRental({
      userId,
      bikeId,
      stationId,
      status: "COMPLETED",
      startTime: new Date("2026-03-15T10:00:00.000Z"),
      endTime: new Date("2026-03-15T10:30:00.000Z"),
      totalPrice: 8000,
    });
    await createRental({
      userId,
      bikeId,
      stationId,
      status: "COMPLETED",
      startTime: new Date("2026-03-20T10:00:00.000Z"),
      endTime: new Date("2026-03-20T10:30:00.000Z"),
      totalPrice: 5000,
    });
    await createRental({
      userId,
      bikeId,
      stationId,
      status: "RENTED",
      startTime: new Date("2026-03-15T11:00:00.000Z"),
    });

    const from = new Date("2026-03-15T00:00:00.000Z");
    const to = new Date("2026-03-15T23:59:59.999Z");

    const totalRevenue = await Effect.runPromise(repo.getCompletedRevenueTotal(from, to));
    const totalRentals = await Effect.runPromise(repo.getCompletedRentalCount(from, to));

    expect(totalRevenue).toBe(20000);
    expect(totalRentals).toBe(2);
  });

  it("builds day buckets and full 24-hour hourly stats", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId);

    await createRental({
      userId,
      bikeId,
      stationId,
      status: "COMPLETED",
      startTime: new Date("2026-03-16T10:00:00.000Z"),
      endTime: new Date("2026-03-16T10:30:00.000Z"),
      totalPrice: 10000,
    });
    await createRental({
      userId,
      bikeId,
      stationId,
      status: "COMPLETED",
      startTime: new Date("2026-03-16T10:45:00.000Z"),
      endTime: new Date("2026-03-16T11:15:00.000Z"),
      totalPrice: 5000,
    });
    await createRental({
      userId,
      bikeId,
      stationId,
      status: "COMPLETED",
      startTime: new Date("2026-03-17T15:00:00.000Z"),
      endTime: new Date("2026-03-17T15:20:00.000Z"),
      totalPrice: 7000,
    });

    const from = new Date("2026-03-16T00:00:00.000Z");
    const to = new Date("2026-03-17T23:59:59.999Z");

    const revenueSeries = await Effect.runPromise(repo.getRevenueSeries(from, to, "DAY"));
    expect(revenueSeries).toHaveLength(2);
    expect(revenueSeries[0]?.totalRevenue).toBe(15000);
    expect(revenueSeries[0]?.totalRentals).toBe(2);
    expect(revenueSeries[1]?.totalRevenue).toBe(7000);
    expect(revenueSeries[1]?.totalRentals).toBe(1);

    const hourly = await Effect.runPromise(repo.getRentalStartHourlyStats(
      new Date("2026-03-16T00:00:00.000Z"),
      new Date("2026-03-16T23:59:59.999Z"),
    ));
    expect(hourly).toHaveLength(24);
    expect(hourly[10]?.totalRentals).toBe(2);
    expect(hourly[15]?.totalRentals).toBe(0);
  });
});
