import type { StatsContracts } from "@mebike/shared";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("reservation forecast e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(
        UserDepsLive,
        PrismaLive,
      );
    },
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("anonymous gets 401 for /v1/stats/reservations-forecast", async () => {
    const response = await fixture.app.request("http://test/v1/stats/reservations-forecast", {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });

  it("non-staff gets 403 for /v1/stats/reservations-forecast", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    const response = await fixture.app.request("http://test/v1/stats/reservations-forecast", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(403);
  });

  it("staff can successfully request /v1/stats/reservations-forecast", async () => {
    const staff = await fixture.factories.user({ role: "STAFF" });
    const token = fixture.auth.makeAccessToken({ userId: staff.id, role: "STAFF" });

    const response = await fixture.app.request("http://test/v1/stats/reservations-forecast", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(200);
  });

  it("applies default timezone-aware window logic based on current minutes boundary", async () => {
    const staff = await fixture.factories.user({ role: "STAFF" });
    const token = fixture.auth.makeAccessToken({ userId: staff.id, role: "STAFF" });

    const station = await fixture.factories.station({ name: "Default Window Station" });
    const bikeA = await fixture.factories.bike({ stationId: station.id });
    const bikeB = await fixture.factories.bike({ stationId: station.id });

    const userA = await fixture.factories.user({ role: "USER" });
    const userB = await fixture.factories.user({ role: "USER" });

    // Scenario A: current time is 12:30 in Vietnam (which is 05:30 UTC)
    // minutes < 50 => window [12:00, 13:00) in Vietnam => [05:00, 06:00) UTC
    vi.setSystemTime(new Date("2026-05-22T05:30:00.000Z"));

    const reservationInsideA = await fixture.factories.reservation({
      userId: userA.id,
      stationId: station.id,
      bikeId: bikeA.id,
      startTime: new Date("2026-05-22T05:15:00.000Z"), // 12:15 Vietnam
      status: "PENDING",
    });

    const reservationOutsideA = await fixture.factories.reservation({
      userId: userB.id,
      stationId: station.id,
      bikeId: bikeB.id,
      startTime: new Date("2026-05-22T06:15:00.000Z"), // 13:15 Vietnam
      status: "PENDING",
    });

    const responseA = await fixture.app.request("http://test/v1/stats/reservations-forecast", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const bodyA = await responseA.json() as StatsContracts.ReservationForecastResponse;
    expect(responseA.status).toBe(200);
    expect(bodyA.windowStart).toBe("2026-05-22T05:00:00.000Z");
    expect(bodyA.windowEnd).toBe("2026-05-22T06:00:00.000Z");
    expect(bodyA.reservedCount).toBe(1);
    expect(bodyA.reservations).toHaveLength(1);
    expect(bodyA.reservations[0].id).toBe(reservationInsideA.id);

    // Scenario B: current time is 12:55 in Vietnam (which is 05:55 UTC)
    // minutes >= 50 => window [13:00, 14:00) in Vietnam => [06:00, 07:00) UTC
    vi.setSystemTime(new Date("2026-05-22T05:55:00.000Z"));

    const responseB = await fixture.app.request("http://test/v1/stats/reservations-forecast", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const bodyB = await responseB.json() as StatsContracts.ReservationForecastResponse;
    expect(responseB.status).toBe(200);
    expect(bodyB.windowStart).toBe("2026-05-22T06:00:00.000Z");
    expect(bodyB.windowEnd).toBe("2026-05-22T07:00:00.000Z");
    expect(bodyB.reservedCount).toBe(1);
    expect(bodyB.reservations).toHaveLength(1);
    expect(bodyB.reservations[0].id).toBe(reservationOutsideA.id);
  });

  it("filters reservations correctly by custom hours window", async () => {
    const staff = await fixture.factories.user({ role: "STAFF" });
    const token = fixture.auth.makeAccessToken({ userId: staff.id, role: "STAFF" });

    const station = await fixture.factories.station({ name: "Custom Window Station" });
    const bikeA = await fixture.factories.bike({ stationId: station.id });
    const bikeB = await fixture.factories.bike({ stationId: station.id });
    const bikeC = await fixture.factories.bike({ stationId: station.id });

    const userA = await fixture.factories.user({ role: "USER" });
    const userB = await fixture.factories.user({ role: "USER" });
    const userC = await fixture.factories.user({ role: "USER" });

    // Custom window: 15h to 19h (Vietnam) on 2026-05-22
    // window [15:00, 19:00) Vietnam => [08:00, 12:00) UTC
    const resA = await fixture.factories.reservation({
      userId: userA.id,
      stationId: station.id,
      bikeId: bikeA.id,
      startTime: new Date("2026-05-22T09:00:00.000Z"), // 16:00 Vietnam - Inside
      status: "PENDING",
    });

    const resB = await fixture.factories.reservation({
      userId: userB.id,
      stationId: station.id,
      bikeId: bikeB.id,
      startTime: new Date("2026-05-22T07:00:00.000Z"), // 14:00 Vietnam - Outside (Before)
      status: "PENDING",
    });

    const resC = await fixture.factories.reservation({
      userId: userC.id,
      stationId: station.id,
      bikeId: bikeC.id,
      startTime: new Date("2026-05-22T10:00:00.000Z"), // 17:00 Vietnam - Cancelled status (Excluded)
      status: "CANCELLED",
    });

    const response = await fixture.app.request(
      "http://test/v1/stats/reservations-forecast?date=2026-05-22&startHour=15&endHour=19",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const body = await response.json() as StatsContracts.ReservationForecastResponse;
    expect(response.status).toBe(200);
    expect(body.windowStart).toBe("2026-05-22T08:00:00.000Z");
    expect(body.windowEnd).toBe("2026-05-22T12:00:00.000Z");
    expect(body.reservedCount).toBe(1);
    expect(body.reservations).toHaveLength(1);
    expect(body.reservations[0].id).toBe(resA.id);
  });

  it("handles midnight wrap when endHour <= startHour for custom windows", async () => {
    const staff = await fixture.factories.user({ role: "STAFF" });
    const token = fixture.auth.makeAccessToken({ userId: staff.id, role: "STAFF" });

    const station = await fixture.factories.station({ name: "Midnight Wrap Station" });
    const bikeD = await fixture.factories.bike({ stationId: station.id });
    const bikeE = await fixture.factories.bike({ stationId: station.id });
    const bikeF = await fixture.factories.bike({ stationId: station.id });

    const userD = await fixture.factories.user({ role: "USER" });
    const userE = await fixture.factories.user({ role: "USER" });
    const userF = await fixture.factories.user({ role: "USER" });

    // Custom window: 23h (today) to 1h (next day) on 2026-05-22
    // window [23:00 on May 22, 01:00 on May 23) Vietnam => [16:00, 18:00) UTC on May 22
    const resD = await fixture.factories.reservation({
      userId: userD.id,
      stationId: station.id,
      bikeId: bikeD.id,
      startTime: new Date("2026-05-22T16:30:00.000Z"), // 23:30 Vietnam - Inside
      status: "PENDING",
    });

    const resE = await fixture.factories.reservation({
      userId: userE.id,
      stationId: station.id,
      bikeId: bikeE.id,
      startTime: new Date("2026-05-22T17:30:00.000Z"), // 00:30 (next day) Vietnam - Inside
      status: "PENDING",
    });

    const resF = await fixture.factories.reservation({
      userId: userF.id,
      stationId: station.id,
      bikeId: bikeF.id,
      startTime: new Date("2026-05-22T18:30:00.000Z"), // 01:30 (next day) Vietnam - Outside (After)
      status: "PENDING",
    });

    const response = await fixture.app.request(
      "http://test/v1/stats/reservations-forecast?date=2026-05-22&startHour=23&endHour=1",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const body = await response.json() as StatsContracts.ReservationForecastResponse;
    expect(response.status).toBe(200);
    expect(body.windowStart).toBe("2026-05-22T16:00:00.000Z");
    expect(body.windowEnd).toBe("2026-05-22T18:00:00.000Z");
    expect(body.reservedCount).toBe(2);
    expect(body.reservations).toHaveLength(2);
    expect(body.reservations[0].id).toBe(resD.id);
    expect(body.reservations[1].id).toBe(resE.id);
  });

  it("returns 400 Bad Request if only startHour or endHour is provided", async () => {
    const staff = await fixture.factories.user({ role: "STAFF" });
    const token = fixture.auth.makeAccessToken({ userId: staff.id, role: "STAFF" });

    const responseOnlyStart = await fixture.app.request(
      "http://test/v1/stats/reservations-forecast?startHour=15",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(responseOnlyStart.status).toBe(400);

    const responseOnlyEnd = await fixture.app.request(
      "http://test/v1/stats/reservations-forecast?endHour=19",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(responseOnlyEnd.status).toBe(400);
  });
});
