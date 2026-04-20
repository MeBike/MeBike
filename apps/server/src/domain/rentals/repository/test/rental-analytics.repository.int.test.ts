import { beforeAll, describe, expect, it } from "vitest";

import { runEffect } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenStationWithAvailableBike } from "@/test/scenarios";

import { makeRentalAnalyticsRepository } from "../rental-analytics.repository";

describe("rentalAnalyticsRepository Integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeRentalAnalyticsRepository>;

  beforeAll(() => {
    repo = makeRentalAnalyticsRepository(fixture.prisma);
  });

  const createRental = async (args: {
    userId: string;
    bikeId: string;
    stationId: string;
    status: "RENTED" | "COMPLETED";
    startTime: Date;
    endTime?: Date | null;
    totalPrice?: number | null;
  }) => {
    await fixture.factories.rental({
      userId: args.userId,
      bikeId: args.bikeId,
      startStationId: args.stationId,
      endStationId: args.endTime ? args.stationId : null,
      startTime: args.startTime,
      endTime: args.endTime ?? null,
      duration: args.endTime
        ? Math.floor((args.endTime.getTime() - args.startTime.getTime()) / 60000)
        : null,
      totalPrice: args.totalPrice == null ? null : String(args.totalPrice),
      status: args.status,
    });
  };

  it("getGlobalRentalCounts returns aggregated counts by status", async () => {
    const user = await fixture.factories.user();
    const { station, bike } = await givenStationWithAvailableBike(fixture);
    const now = new Date("2026-03-16T10:00:00.000Z");

    await createRental({ userId: user.id, bikeId: bike.id, stationId: station.id, status: "RENTED", startTime: now });
    await createRental({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      status: "COMPLETED",
      startTime: now,
      endTime: new Date("2026-03-16T11:00:00.000Z"),
      totalPrice: 10000,
    });

    const rows = await runEffect(repo.getGlobalRentalCounts());
    const byStatus = new Map(rows.map(row => [row.status, row.count]));

    expect(byStatus.get("RENTED")).toBe(1);
    expect(byStatus.get("COMPLETED")).toBe(1);
  });

  it("completed totals only include completed rentals in range", async () => {
    const user = await fixture.factories.user();
    const { station, bike } = await givenStationWithAvailableBike(fixture);

    await createRental({ userId: user.id, bikeId: bike.id, stationId: station.id, status: "COMPLETED", startTime: new Date("2026-03-15T08:00:00.000Z"), endTime: new Date("2026-03-15T09:00:00.000Z"), totalPrice: 12000 });
    await createRental({ userId: user.id, bikeId: bike.id, stationId: station.id, status: "COMPLETED", startTime: new Date("2026-03-15T10:00:00.000Z"), endTime: new Date("2026-03-15T10:30:00.000Z"), totalPrice: 8000 });
    await createRental({ userId: user.id, bikeId: bike.id, stationId: station.id, status: "COMPLETED", startTime: new Date("2026-03-20T10:00:00.000Z"), endTime: new Date("2026-03-20T10:30:00.000Z"), totalPrice: 5000 });
    await createRental({ userId: user.id, bikeId: bike.id, stationId: station.id, status: "RENTED", startTime: new Date("2026-03-15T11:00:00.000Z") });

    const from = new Date("2026-03-15T00:00:00.000Z");
    const to = new Date("2026-03-15T23:59:59.999Z");

    const totalRevenue = await runEffect(repo.getCompletedRevenueTotal(from, to));
    const totalRentals = await runEffect(repo.getCompletedRentalCount(from, to));

    expect(totalRevenue).toBe(20000);
    expect(totalRentals).toBe(2);
  });

  it("builds revenue buckets and full 24-hour hourly stats", async () => {
    const user = await fixture.factories.user();
    const { station, bike } = await givenStationWithAvailableBike(fixture);

    await createRental({ userId: user.id, bikeId: bike.id, stationId: station.id, status: "COMPLETED", startTime: new Date("2026-03-16T10:00:00.000Z"), endTime: new Date("2026-03-16T10:30:00.000Z"), totalPrice: 10000 });
    await createRental({ userId: user.id, bikeId: bike.id, stationId: station.id, status: "COMPLETED", startTime: new Date("2026-03-16T10:45:00.000Z"), endTime: new Date("2026-03-16T11:15:00.000Z"), totalPrice: 5000 });
    await createRental({ userId: user.id, bikeId: bike.id, stationId: station.id, status: "COMPLETED", startTime: new Date("2026-03-17T15:00:00.000Z"), endTime: new Date("2026-03-17T15:20:00.000Z"), totalPrice: 7000 });

    const from = new Date("2026-03-16T00:00:00.000Z");
    const to = new Date("2026-03-17T23:59:59.999Z");

    const revenueSeries = await runEffect(repo.getRevenueSeries(from, to, "DAY"));
    expect(revenueSeries).toHaveLength(2);
    expect(revenueSeries[0].date.toISOString()).toContain("2026-03-16");
    expect(revenueSeries[0].totalRentals).toBe(2);
    expect(revenueSeries[0].totalRevenue).toBe(15000);
    expect(revenueSeries[1].date.toISOString()).toContain("2026-03-17");
    expect(revenueSeries[1].totalRentals).toBe(1);
    expect(revenueSeries[1].totalRevenue).toBe(7000);

    const hourly = await runEffect(repo.getRentalStartHourlyStats(from, to));
    expect(hourly).toHaveLength(24);
    expect(hourly.find(row => row.hour === 10)?.totalRentals).toBe(2);
    expect(hourly.find(row => row.hour === 15)?.totalRentals).toBe(1);
  });
});
