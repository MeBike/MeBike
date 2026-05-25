import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("reservation forecast e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { ReservationDepsLive, UserDepsLive } = await import("@/http/shared/providers");

      return Layer.mergeAll(
        PrismaLive,
        UserDepsLive,
        ReservationDepsLive,
      );
    },
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("staff can read /v1/stats/reservations-forecast default next hour to 23h", async () => {
    // Mock system time to 15:50 Vietnam time (08:50 UTC)
    const mockNow = new Date("2026-05-25T08:50:00.000Z");
    vi.setSystemTime(mockNow);

    const station = await fixture.factories.station({ name: "Forecast Station" });
    const staff = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: staff.id, stationId: station.id });

    const user1 = await fixture.factories.user({ role: "USER" });
    const user2 = await fixture.factories.user({ role: "USER" });
    const user3 = await fixture.factories.user({ role: "USER" });

    // Reservation in 16-17h slot (16:30 Vietnam time -> 09:30 UTC)
    await fixture.factories.reservation({
      userId: user1.id,
      stationId: station.id,
      startTime: new Date("2026-05-25T09:30:00.000Z"),
      status: "PENDING",
    });

    // Reservation in 17-18h slot (17:15 Vietnam time -> 10:15 UTC)
    await fixture.factories.reservation({
      userId: user2.id,
      stationId: station.id,
      startTime: new Date("2026-05-25T10:15:00.000Z"),
      status: "PENDING",
    });

    // Reservation at another station (should be excluded)
    const otherStation = await fixture.factories.station({ name: "Other Station" });
    await fixture.factories.reservation({
      userId: user3.id,
      stationId: otherStation.id,
      startTime: new Date("2026-05-25T09:30:00.000Z"),
      status: "PENDING",
    });

    const token = fixture.auth.makeAccessToken({ userId: staff.id, role: "STAFF" });

    const response = await fixture.app.request("http://test/v1/stats/reservations-forecast", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.windowStart).toBe("2026-05-25T09:00:00.000Z"); // 16:00:00 UTC
    expect(body.windowEnd).toBe("2026-05-25T16:00:00.000Z"); // 23:00:00 UTC
    expect(body.station).toEqual({
      id: station.id,
      name: "Forecast Station",
    });

    // 16 to 23 -> 7 hourly slots (16-17, 17-18, 18-19, 19-20, 20-21, 21-22, 22-23)
    expect(body.hours.length).toBe(7);

    // Slot 16-17 (first hour)
    expect(body.hours[0].label).toBe("16:00");
    expect(body.hours[0].timestamp).toBe("2026-05-25T09:00:00.000Z");
    expect(body.hours[0].reservedCount).toBe(1);

    // Slot 17-18 (second hour)
    expect(body.hours[1].label).toBe("17:00");
    expect(body.hours[1].timestamp).toBe("2026-05-25T10:00:00.000Z");
    expect(body.hours[1].reservedCount).toBe(1);

    // Other slots should be 0
    for (let i = 2; i < 7; i++) {
      expect(body.hours[i].reservedCount).toBe(0);
    }
  });

  it("staff can read /v1/stats/reservations-forecast with custom filter", async () => {
    // Mock system time to 15:50 Vietnam time (08:50 UTC)
    const mockNow = new Date("2026-05-25T08:50:00.000Z");
    vi.setSystemTime(mockNow);

    const station = await fixture.factories.station({ name: "Forecast Station" });
    const staff = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: staff.id, stationId: station.id });

    const user = await fixture.factories.user({ role: "USER" });

    // Reservation in 6-7h slot (06:30 Vietnam time -> 23:30 UTC on May 24th)
    await fixture.factories.reservation({
      userId: user.id,
      stationId: station.id,
      startTime: new Date("2026-05-24T23:30:00.000Z"),
      status: "PENDING",
    });

    const token = fixture.auth.makeAccessToken({ userId: staff.id, role: "STAFF" });

    // Requesting custom window: 5h to 15h (which are past hours)
    const response = await fixture.app.request(
      "http://test/v1/stats/reservations-forecast?startHour=5&endHour=15",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.windowStart).toBe("2026-05-24T22:00:00.000Z"); // 5:00:00 UTC
    expect(body.windowEnd).toBe("2026-05-25T08:00:00.000Z"); // 15:00:00 UTC

    // 5 to 15 -> 10 hourly slots (5-6, 6-7, 7-8, 8-9, 9-10, 10-11, 11-12, 12-13, 13-14, 14-15)
    expect(body.hours.length).toBe(10);

    // Slot 5-6 (index 0) should have 0
    expect(body.hours[0].reservedCount).toBe(0);

    // Slot 6-7 (index 1) should have 1
    expect(body.hours[1].reservedCount).toBe(1);
  });

  it("non-staff gets 403", async () => {
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

  it("anonymous gets 401", async () => {
    const response = await fixture.app.request("http://test/v1/stats/reservations-forecast", {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });
});
