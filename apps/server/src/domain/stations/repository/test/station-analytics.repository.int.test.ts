import { Effect } from "effect";
import { beforeAll, describe, expect, it } from "vitest";

import { StationRepositoryError } from "@/domain/stations/errors";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectDefect } from "@/test/effect/assertions";

import { setupStationRepositoryIntTestKit } from "./station.repository.int.test-kit";

describe("stationAnalyticsRepository Integration", () => {
  const kit = setupStationRepositoryIntTestKit();
  let repo: ReturnType<typeof kit.makeAnalyticsRepo>;

  beforeAll(() => {
    repo = kit.makeAnalyticsRepo();
  });

  it("getRevenueByStation attributes revenue to start station and recognizes it by end time", async () => {
    const stationA = await kit.fixture.factories.station({ name: "Revenue Station A" });
    const stationB = await kit.fixture.factories.station({ name: "Revenue Station B" });
    const bikeA = await kit.fixture.factories.bike({ stationId: stationA.id });
    const bikeB = await kit.fixture.factories.bike({ stationId: stationB.id });
    const userA = await kit.fixture.factories.user({ email: "revenue-user-a@example.com" });
    const userB = await kit.fixture.factories.user({ email: "revenue-user-b@example.com" });
    const from = new Date("2026-02-01T00:00:00.000Z");
    const to = new Date("2026-02-28T23:59:59.999Z");

    await kit.fixture.factories.rental({
      userId: userA.id,
      bikeId: bikeA.id,
      startStationId: stationA.id,
      startTime: new Date("2026-01-31T23:45:00.000Z"),
      endTime: new Date("2026-02-01T00:15:00.000Z"),
      duration: 30,
      totalPrice: "10000",
      status: "COMPLETED",
    });
    await kit.fixture.factories.rental({
      userId: userA.id,
      bikeId: bikeA.id,
      startStationId: stationA.id,
      startTime: new Date("2026-02-10T09:00:00.000Z"),
      endTime: new Date("2026-02-10T10:00:00.000Z"),
      duration: 60,
      totalPrice: "20000",
      status: "COMPLETED",
    });
    await kit.fixture.factories.rental({
      userId: userB.id,
      bikeId: bikeB.id,
      startStationId: stationB.id,
      startTime: new Date("2026-02-12T09:00:00.000Z"),
      endTime: new Date("2026-02-12T09:20:00.000Z"),
      duration: 20,
      totalPrice: "5000",
      status: "COMPLETED",
    });
    await kit.fixture.factories.rental({
      userId: userA.id,
      bikeId: bikeA.id,
      startStationId: stationA.id,
      startTime: new Date("2026-02-28T23:30:00.000Z"),
      endTime: new Date("2026-03-01T00:05:00.000Z"),
      duration: 35,
      totalPrice: "7000",
      status: "COMPLETED",
    });

    const result = await Effect.runPromise(repo.getRevenueByStation({ from, to }));

    expect(result).toHaveLength(2);

    const stationARow = result.find(item => item.stationId === stationA.id);
    const stationBRow = result.find(item => item.stationId === stationB.id);

    expect(stationARow).toMatchObject({
      stationId: stationA.id,
      name: "Revenue Station A",
      totalRentals: 2,
      totalRevenue: 30000,
      totalDuration: 90,
      avgDuration: 45,
    });
    expect(stationBRow).toMatchObject({
      stationId: stationB.id,
      name: "Revenue Station B",
      totalRentals: 1,
      totalRevenue: 5000,
      totalDuration: 20,
      avgDuration: 20,
    });
  });

  it("getRevenueForStation returns only the assigned station aggregate", async () => {
    const stationA = await kit.fixture.factories.station({ name: "Scoped Revenue Station A" });
    const stationB = await kit.fixture.factories.station({ name: "Scoped Revenue Station B" });
    const stationC = await kit.fixture.factories.station({ name: "Scoped Revenue Station C" });
    const bikeA = await kit.fixture.factories.bike({ stationId: stationA.id });
    const bikeB = await kit.fixture.factories.bike({ stationId: stationB.id });
    const userA = await kit.fixture.factories.user({ email: "scoped-revenue-user-a@example.com" });
    const userB = await kit.fixture.factories.user({ email: "scoped-revenue-user-b@example.com" });
    const from = new Date("2026-02-01T00:00:00.000Z");
    const to = new Date("2026-02-28T23:59:59.999Z");

    await kit.fixture.factories.rental({
      userId: userA.id,
      bikeId: bikeA.id,
      startStationId: stationA.id,
      startTime: new Date("2026-02-02T09:00:00.000Z"),
      endTime: new Date("2026-02-02T09:30:00.000Z"),
      duration: 30,
      totalPrice: "12000",
      status: "COMPLETED",
    });
    await kit.fixture.factories.rental({
      userId: userB.id,
      bikeId: bikeB.id,
      startStationId: stationB.id,
      startTime: new Date("2026-02-03T10:00:00.000Z"),
      endTime: new Date("2026-02-03T10:45:00.000Z"),
      duration: 45,
      totalPrice: "9000",
      status: "COMPLETED",
    });

    const scoped = await Effect.runPromise(repo.getRevenueForStation({
      stationId: stationA.id,
      from,
      to,
    }));
    const empty = await Effect.runPromise(repo.getRevenueForStation({
      stationId: stationC.id,
      from,
      to,
    }));

    expect(scoped).toMatchObject({
      totalRentals: 1,
      totalRevenue: 12000,
      totalDuration: 30,
      avgDuration: 30,
    });
    expect(empty).toBeNull();
  });

  it("getRevenueSeries returns bucketed revenue and supports station scope", async () => {
    const stationA = await kit.fixture.factories.station({ name: "Series Station A" });
    const stationB = await kit.fixture.factories.station({ name: "Series Station B" });
    const bikeA = await kit.fixture.factories.bike({ stationId: stationA.id });
    const bikeB = await kit.fixture.factories.bike({ stationId: stationB.id });
    const userA = await kit.fixture.factories.user({ email: "series-user-a@example.com" });
    const userB = await kit.fixture.factories.user({ email: "series-user-b@example.com" });
    const from = new Date("2026-02-01T00:00:00.000Z");
    const to = new Date("2026-02-28T23:59:59.999Z");

    await kit.fixture.factories.rental({
      userId: userA.id,
      bikeId: bikeA.id,
      startStationId: stationA.id,
      startTime: new Date("2026-02-02T09:00:00.000Z"),
      endTime: new Date("2026-02-02T09:30:00.000Z"),
      duration: 30,
      totalPrice: "12000",
      status: "COMPLETED",
    });
    await kit.fixture.factories.rental({
      userId: userA.id,
      bikeId: bikeA.id,
      startStationId: stationA.id,
      startTime: new Date("2026-02-15T09:00:00.000Z"),
      endTime: new Date("2026-02-15T09:45:00.000Z"),
      duration: 45,
      totalPrice: "8000",
      status: "COMPLETED",
    });
    await kit.fixture.factories.rental({
      userId: userB.id,
      bikeId: bikeB.id,
      startStationId: stationB.id,
      startTime: new Date("2026-02-15T10:00:00.000Z"),
      endTime: new Date("2026-02-15T10:20:00.000Z"),
      duration: 20,
      totalPrice: "5000",
      status: "COMPLETED",
    });

    const allStations = await Effect.runPromise(repo.getRevenueSeries({
      from,
      to,
      groupBy: "DAY",
    }));
    const scoped = await Effect.runPromise(repo.getRevenueSeries({
      stationId: stationA.id,
      from,
      to,
      groupBy: "DAY",
    }));

    expect(allStations).toEqual([
      {
        date: new Date("2026-02-02T00:00:00.000Z"),
        totalRevenue: 12000,
        totalRentals: 1,
      },
      {
        date: new Date("2026-02-15T00:00:00.000Z"),
        totalRevenue: 13000,
        totalRentals: 2,
      },
    ]);
    expect(scoped).toEqual([
      {
        date: new Date("2026-02-02T00:00:00.000Z"),
        totalRevenue: 12000,
        totalRentals: 1,
      },
      {
        date: new Date("2026-02-15T00:00:00.000Z"),
        totalRevenue: 8000,
        totalRentals: 1,
      },
    ]);
  });

  it("defects with StationRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();

    try {
      const brokenRepo = kit.makeAnalyticsRepo(broken.client);

      await expectDefect(
        brokenRepo.getRevenueByStation({
          from: new Date("2026-02-01T00:00:00.000Z"),
          to: new Date("2026-02-28T23:59:59.999Z"),
        }),
        StationRepositoryError,
        { operation: "getRevenueByStation" },
      );
    }
    finally {
      await broken.stop();
    }
  });
});
