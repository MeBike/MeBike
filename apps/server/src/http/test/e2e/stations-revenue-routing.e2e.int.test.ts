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

  async function createAdminToken() {
    const user = await fixture.factories.user({ role: "ADMIN" });
    return fixture.auth.makeAccessToken({ userId: user.id, role: "ADMIN" });
  }

  async function createManagerToken(stationId?: string) {
    const user = await fixture.factories.user({ role: "MANAGER" });

    if (stationId) {
      await fixture.factories.userOrgAssignment({ userId: user.id, stationId });
    }

    return fixture.auth.makeAccessToken({ userId: user.id, role: "MANAGER" });
  }

  async function createAgencyToken(withStation = true) {
    const user = await fixture.factories.user({ role: "AGENCY" });
    const agency = await fixture.prisma.agency.create({
      data: {
        name: `Agency ${user.id}`,
        contactPhone: "0281234567",
        status: "ACTIVE",
      },
    });

    await fixture.factories.userOrgAssignment({ userId: user.id, agencyId: agency.id });

    const station = withStation
      ? await fixture.factories.station({
          name: "Agency Revenue Station",
          stationType: "AGENCY",
          agencyId: agency.id,
        })
      : null;

    return {
      station,
      token: fixture.auth.makeAccessToken({ userId: user.id, role: "AGENCY" }),
    };
  }

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
      startTime: new Date("2026-01-31T23:45:00.000Z"),
      endTime: new Date("2026-02-01T00:15:00.000Z"),
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

  it("rejects reversed station revenue date range with station error payload", async () => {
    const response = await fixture.app.request(
      "http://test/v1/stations/revenue?from=2026-03-01T00:00:00.000Z&to=2026-02-01T00:00:00.000Z",
      { method: "GET" },
    );
    const body = await response.json() as StationsContracts.StationErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("INVALID_DATE_RANGE");
    expect(body.details?.from).toBe("2026-03-01T00:00:00.000Z");
    expect(body.details?.to).toBe("2026-02-01T00:00:00.000Z");
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

  it("returns station revenue series when groupBy is requested", async () => {
    const station = await fixture.factories.station({ name: "Series Response Station" });
    const bike = await fixture.factories.bike({ stationId: station.id });
    const user = await fixture.factories.user({ email: "station-series-response@example.com" });

    await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date("2026-02-05T09:00:00.000Z"),
      endTime: new Date("2026-02-05T09:30:00.000Z"),
      duration: 30,
      totalPrice: "5000",
      status: "COMPLETED",
    });
    await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date("2026-02-20T09:00:00.000Z"),
      endTime: new Date("2026-02-20T09:30:00.000Z"),
      duration: 30,
      totalPrice: "7000",
      status: "COMPLETED",
    });

    const response = await fixture.app.request(
      "http://test/v1/stations/revenue?from=2026-02-01T00:00:00.000Z&to=2026-02-28T23:59:59.999Z&groupBy=DAY",
      { method: "GET" },
    );
    const body = await response.json() as StationsContracts.StationRevenueResponse;

    expect(response.status).toBe(200);
    expect(body.groupBy).toBe("DAY");
    expect(body.series).toEqual([
      {
        date: "2026-02-05T00:00:00.000Z",
        totalRevenue: 5000,
        totalRentals: 1,
      },
      {
        date: "2026-02-20T00:00:00.000Z",
        totalRevenue: 7000,
        totalRentals: 1,
      },
    ]);
  });

  it("requires admin auth for admin station revenue", async () => {
    const response = await fixture.app.request("http://test/v1/admin/stations/revenue", {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });

  it("returns all-station revenue for admin", async () => {
    const stationA = await fixture.factories.station({ name: "Admin Revenue Station A" });
    const stationB = await fixture.factories.station({ name: "Admin Revenue Station B" });
    const bikeA = await fixture.factories.bike({ stationId: stationA.id });
    const bikeB = await fixture.factories.bike({ stationId: stationB.id });
    const userA = await fixture.factories.user({ email: "admin-station-revenue-a@example.com" });
    const userB = await fixture.factories.user({ email: "admin-station-revenue-b@example.com" });
    const token = await createAdminToken();

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
      userId: userB.id,
      bikeId: bikeB.id,
      startStationId: stationB.id,
      startTime: new Date("2026-02-12T09:00:00.000Z"),
      endTime: new Date("2026-02-12T09:20:00.000Z"),
      duration: 20,
      totalPrice: "5000",
      status: "COMPLETED",
    });

    const response = await fixture.app.request(
      "http://test/v1/admin/stations/revenue?from=2026-02-01T00:00:00.000Z&to=2026-02-28T23:59:59.999Z",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const body = await response.json() as StationsContracts.StationRevenueResponse;

    expect(response.status).toBe(200);
    expect(body.summary.totalRevenue).toBe(15000);
    expect(body.summary.totalStations).toBe(2);
  });

  it("returns all-station revenue series for admin when groupBy is requested", async () => {
    const station = await fixture.factories.station({ name: "Admin Series Station" });
    const bike = await fixture.factories.bike({ stationId: station.id });
    const user = await fixture.factories.user({ email: "admin-station-series@example.com" });
    const token = await createAdminToken();

    await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date("2026-02-05T09:00:00.000Z"),
      endTime: new Date("2026-02-05T09:30:00.000Z"),
      duration: 30,
      totalPrice: "5000",
      status: "COMPLETED",
    });
    await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date("2026-02-15T09:00:00.000Z"),
      endTime: new Date("2026-02-15T09:30:00.000Z"),
      duration: 30,
      totalPrice: "7000",
      status: "COMPLETED",
    });

    const response = await fixture.app.request(
      "http://test/v1/admin/stations/revenue?from=2026-02-01T00:00:00.000Z&to=2026-02-28T23:59:59.999Z&groupBy=MONTH",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const body = await response.json() as StationsContracts.StationRevenueResponse;

    expect(response.status).toBe(200);
    expect(body.groupBy).toBe("MONTH");
    expect(body.series).toEqual([
      {
        date: "2026-02-01T00:00:00.000Z",
        totalRevenue: 12000,
        totalRentals: 2,
      },
    ]);
  });

  it("returns only assigned station revenue for manager", async () => {
    const visibleStation = await fixture.factories.station({ name: "Manager Visible Station" });
    const hiddenStation = await fixture.factories.station({ name: "Manager Hidden Station" });
    const bikeA = await fixture.factories.bike({ stationId: visibleStation.id });
    const bikeB = await fixture.factories.bike({ stationId: hiddenStation.id });
    const userA = await fixture.factories.user({ email: "manager-station-revenue-a@example.com" });
    const userB = await fixture.factories.user({ email: "manager-station-revenue-b@example.com" });
    const token = await createManagerToken(visibleStation.id);

    await fixture.factories.rental({
      userId: userA.id,
      bikeId: bikeA.id,
      startStationId: visibleStation.id,
      startTime: new Date("2026-02-05T09:00:00.000Z"),
      endTime: new Date("2026-02-05T09:30:00.000Z"),
      duration: 30,
      totalPrice: "10000",
      status: "COMPLETED",
    });
    await fixture.factories.rental({
      userId: userB.id,
      bikeId: bikeB.id,
      startStationId: hiddenStation.id,
      startTime: new Date("2026-02-12T09:00:00.000Z"),
      endTime: new Date("2026-02-12T09:20:00.000Z"),
      duration: 20,
      totalPrice: "5000",
      status: "COMPLETED",
    });

    const response = await fixture.app.request(
      "http://test/v1/manager/stations/revenue?from=2026-02-01T00:00:00.000Z&to=2026-02-28T23:59:59.999Z",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const body = await response.json() as StationsContracts.StationRevenueResponse;

    expect(response.status).toBe(200);
    expect(body.summary.totalRevenue).toBe(10000);
    expect(body.summary.totalStations).toBe(1);
    expect(body.stations).toHaveLength(1);
    expect(body.stations[0]?.id).toBe(visibleStation.id);
  });

  it("returns assigned station revenue series for manager when groupBy is requested", async () => {
    const visibleStation = await fixture.factories.station({ name: "Manager Series Station" });
    const hiddenStation = await fixture.factories.station({ name: "Manager Hidden Series Station" });
    const bikeA = await fixture.factories.bike({ stationId: visibleStation.id });
    const bikeB = await fixture.factories.bike({ stationId: hiddenStation.id });
    const userA = await fixture.factories.user({ email: "manager-station-series-a@example.com" });
    const userB = await fixture.factories.user({ email: "manager-station-series-b@example.com" });
    const token = await createManagerToken(visibleStation.id);

    await fixture.factories.rental({
      userId: userA.id,
      bikeId: bikeA.id,
      startStationId: visibleStation.id,
      startTime: new Date("2026-02-05T09:00:00.000Z"),
      endTime: new Date("2026-02-05T09:30:00.000Z"),
      duration: 30,
      totalPrice: "10000",
      status: "COMPLETED",
    });
    await fixture.factories.rental({
      userId: userB.id,
      bikeId: bikeB.id,
      startStationId: hiddenStation.id,
      startTime: new Date("2026-02-12T09:00:00.000Z"),
      endTime: new Date("2026-02-12T09:20:00.000Z"),
      duration: 20,
      totalPrice: "5000",
      status: "COMPLETED",
    });

    const response = await fixture.app.request(
      "http://test/v1/manager/stations/revenue?from=2026-02-01T00:00:00.000Z&to=2026-02-28T23:59:59.999Z&groupBy=DAY",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const body = await response.json() as StationsContracts.StationRevenueResponse;

    expect(response.status).toBe(200);
    expect(body.groupBy).toBe("DAY");
    expect(body.series).toEqual([
      {
        date: "2026-02-05T00:00:00.000Z",
        totalRevenue: 10000,
        totalRentals: 1,
      },
    ]);
  });

  it("returns 404 for manager revenue when manager has no assigned station", async () => {
    const token = await createManagerToken();

    const response = await fixture.app.request("http://test/v1/manager/stations/revenue", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(404);
  });

  it("returns only assigned station revenue for agency", async () => {
    const { station, token } = await createAgencyToken(true);
    const hiddenStation = await fixture.factories.station({ name: "Agency Hidden Station" });
    const bikeA = await fixture.factories.bike({ stationId: station!.id });
    const bikeB = await fixture.factories.bike({ stationId: hiddenStation.id });
    const userA = await fixture.factories.user({ email: "agency-station-revenue-a@example.com" });
    const userB = await fixture.factories.user({ email: "agency-station-revenue-b@example.com" });

    await fixture.factories.rental({
      userId: userA.id,
      bikeId: bikeA.id,
      startStationId: station!.id,
      startTime: new Date("2026-02-05T09:00:00.000Z"),
      endTime: new Date("2026-02-05T09:30:00.000Z"),
      duration: 30,
      totalPrice: "11000",
      status: "COMPLETED",
    });
    await fixture.factories.rental({
      userId: userB.id,
      bikeId: bikeB.id,
      startStationId: hiddenStation.id,
      startTime: new Date("2026-02-12T09:00:00.000Z"),
      endTime: new Date("2026-02-12T09:20:00.000Z"),
      duration: 20,
      totalPrice: "5000",
      status: "COMPLETED",
    });

    const response = await fixture.app.request(
      "http://test/v1/agency/stations/revenue?from=2026-02-01T00:00:00.000Z&to=2026-02-28T23:59:59.999Z",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const body = await response.json() as StationsContracts.StationRevenueResponse;

    expect(response.status).toBe(200);
    expect(body.summary.totalRevenue).toBe(11000);
    expect(body.summary.totalStations).toBe(1);
    expect(body.stations[0]?.id).toBe(station!.id);
  });

  it("returns 404 for agency revenue when agency has no assigned station", async () => {
    const { token } = await createAgencyToken(false);

    const response = await fixture.app.request("http://test/v1/agency/stations/revenue", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(404);
  });
});
