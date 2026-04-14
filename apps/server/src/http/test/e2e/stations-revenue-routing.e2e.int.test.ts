import type { StationsContracts } from "@mebike/shared";

import { describe, expect, it, vi } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("stations revenue routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");
      const { StationDepsLive } = await import("@/http/shared/features/station.layers");

      return Layer.mergeAll(UserDepsLive, StationDepsLive);
    },
  });

  it("returns aggregate revenue grouped by station", async () => {
    const stationA = await fixture.factories.station({ name: "Revenue Station A" });
    const stationB = await fixture.factories.station({ name: "Revenue Station B" });
    const bikeA = await fixture.factories.bike({ stationId: stationA.id });
    const bikeB = await fixture.factories.bike({ stationId: stationB.id });
    const userA = await fixture.factories.user({ email: "station-revenue-a@example.com" });
    const userB = await fixture.factories.user({ email: "station-revenue-b@example.com" });

    await fixture.factories.rental({
      userId: userA.id,
      bikeId: bikeA.id,
      startStationId: stationA.id,
      startTime: new Date("2026-02-05T09:00:00.000Z"),
      endTime: new Date("2026-02-05T09:30:00.000Z"),
      duration: 30,
      totalPrice: "10000",
      status: "COMPLETED",
    });
    await fixture.factories.rental({
      userId: userA.id,
      bikeId: bikeA.id,
      startStationId: stationA.id,
      startTime: new Date("2026-02-10T09:00:00.000Z"),
      endTime: new Date("2026-02-10T10:00:00.000Z"),
      duration: 60,
      totalPrice: "20000",
      status: "COMPLETED",
    });
    await fixture.factories.rental({
      userId: userB.id,
      bikeId: bikeB.id,
      startStationId: stationB.id,
      startTime: new Date("2026-02-12T09:00:00.000Z"),
      endTime: new Date("2026-02-12T09:20:00.000Z"),
      duration: 20,
      totalPrice: "5000",
      status: "COMPLETED",
    });
    await fixture.factories.rental({
      userId: userB.id,
      bikeId: bikeB.id,
      startStationId: stationB.id,
      startTime: new Date("2026-03-01T09:00:00.000Z"),
      endTime: new Date("2026-03-01T09:20:00.000Z"),
      duration: 20,
      totalPrice: "7000",
      status: "COMPLETED",
    });

    const response = await fixture.app.request(
      "http://test/v1/stations/revenue?from=2026-02-01T00:00:00.000Z&to=2026-02-28T23:59:59.999Z",
      { method: "GET" },
    );
    const body = await response.json() as StationsContracts.StationRevenueResponse;

    expect(response.status).toBe(200);
    expect(body.period).toEqual({
      from: "2026-02-01T00:00:00.000Z",
      to: "2026-02-28T23:59:59.999Z",
    });
    expect(body.summary).toEqual({
      totalStations: 2,
      totalRevenue: 35000,
      totalRentals: 3,
      avgRevenuePerStation: 17500,
    });
    expect(body.stations).toHaveLength(2);
    expect(body.stations[0]).toMatchObject({
      id: stationA.id,
      name: "Revenue Station A",
      totalRentals: 2,
      totalRevenue: 30000,
      totalDuration: 90,
      avgDuration: 45,
    });
    expect(body.stations[1]).toMatchObject({
      id: stationB.id,
      name: "Revenue Station B",
      totalRentals: 1,
      totalRevenue: 5000,
      totalDuration: 20,
      avgDuration: 20,
    });
  });

  it("rejects partial station revenue date range", async () => {
    const response = await fixture.app.request(
      "http://test/v1/stations/revenue?from=2026-02-01T00:00:00.000Z",
      { method: "GET" },
    );
    const body = await response.json() as StationsContracts.StationErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("INVALID_DATE_RANGE");
    expect(body.details?.from).toBe("2026-02-01T00:00:00.000Z");
    expect(body.details?.to).toBeUndefined();
  });

  it("defaults omitted date range to previous full UTC month", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-14T12:00:00.000Z"));

    const station = await fixture.factories.station({ name: "Default Range Station" });
    const bike = await fixture.factories.bike({ stationId: station.id });
    const user = await fixture.factories.user({ email: "station-default-range@example.com" });

    await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date("2026-03-05T09:00:00.000Z"),
      endTime: new Date("2026-03-05T09:20:00.000Z"),
      duration: 20,
      totalPrice: "5000",
      status: "COMPLETED",
    });
    await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date("2026-04-05T09:00:00.000Z"),
      endTime: new Date("2026-04-05T09:20:00.000Z"),
      duration: 20,
      totalPrice: "9000",
      status: "COMPLETED",
    });

    try {
      const response = await fixture.app.request("http://test/v1/stations/revenue", {
        method: "GET",
      });
      const body = await response.json() as StationsContracts.StationRevenueResponse;

      expect(response.status).toBe(200);
      expect(body.period).toEqual({
        from: "2026-03-01T00:00:00.000Z",
        to: "2026-03-31T23:59:59.999Z",
      });
      expect(body.summary.totalRevenue).toBe(5000);
      expect(body.summary.totalRentals).toBe(1);
      expect(body.stations).toHaveLength(1);
      expect(body.stations[0]?.id).toBe(station.id);
    }
    finally {
      vi.useRealTimers();
    }
  });
});
