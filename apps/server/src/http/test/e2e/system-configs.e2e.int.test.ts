import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("system configs e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const {
        StationDepsLive,
        UserDepsLive,
        RedistributionRequestDepsLive,
      } = await import("@/http/shared/providers");

      return Layer.mergeAll(
        StationDepsLive,
        UserDepsLive,
        RedistributionRequestDepsLive,
      );
    },
  });

  async function makeAdminToken() {
    const admin = await fixture.factories.user({ role: "ADMIN" });
    return fixture.auth.makeAccessToken({ userId: admin.id, role: "ADMIN" });
  }

  async function makeStaffToken() {
    const staff = await fixture.factories.user({ role: "STAFF" });
    return fixture.auth.makeAccessToken({ userId: staff.id, role: "STAFF" });
  }

  it("enforces role protection and requires Admin role", async () => {
    const staffToken = await makeStaffToken();

    // 1. GET without token -> 401
    const getNoToken = await fixture.app.request("http://test/v1/admin/system-configs", {
      method: "GET",
    });
    expect(getNoToken.status).toBe(401);

    // 2. GET with Staff token -> 403
    const getStaff = await fixture.app.request("http://test/v1/admin/system-configs", {
      method: "GET",
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    expect(getStaff.status).toBe(403);

    // 3. PUT with Staff token -> 403
    const putStaff = await fixture.app.request("http://test/v1/admin/system-configs/test_key", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: "test_val" }),
    });
    expect(putStaff.status).toBe(403);
  });

  it("supports GET/PUT operations with correct validations", async () => {
    const adminToken = await makeAdminToken();

    // Clear existing config if any to make test clean
    await fixture.prisma.systemConfig.deleteMany();

    // 1. Create a config using Prisma instead of POST
    await fixture.prisma.systemConfig.create({
      data: {
        key: "min_available_bikes_at_station",
        value: "10",
      },
    });

    // 2. GET list
    const getRes = await fixture.app.request("http://test/v1/admin/system-configs", {
      method: "GET",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(Array.isArray(getBody)).toBe(true);
    expect(getBody.some((cfg: any) => cfg.key === "min_available_bikes_at_station" && cfg.value === "10")).toBe(true);

    // 3. Update the config (PUT)
    const putRes = await fixture.app.request("http://test/v1/admin/system-configs/min_available_bikes_at_station", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: "15" }),
    });
    expect(putRes.status).toBe(200);
    const putBody = await putRes.json();
    expect(putBody.value).toBe("15");

    // 4. Invalid values for min_available_bikes_at_station (negative) -> 400
    const invalidMinRes = await fixture.app.request("http://test/v1/admin/system-configs/min_available_bikes_at_station", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: "-1" }),
    });
    expect(invalidMinRes.status).toBe(400);

    // 5. Create redistribution_pending_expire_hours using Prisma
    await fixture.prisma.systemConfig.create({
      data: {
        key: "redistribution_pending_expire_hours",
        value: "24",
      },
    });

    // 6. Invalid values for redistribution_pending_expire_hours (0 or negative) -> 400
    const invalidHoursRes = await fixture.app.request("http://test/v1/admin/system-configs/redistribution_pending_expire_hours", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: "0" }),
    });
    expect(invalidHoursRes.status).toBe(400);
  });

  it("verifies that setting changes immediately affect redistribution business logic", async () => {
    const adminToken = await makeAdminToken();

    // 1. Setup Source and Target stations
    const sourceStation = await fixture.factories.station({ capacity: 20 });
    const targetStation = await fixture.factories.station({ capacity: 20 });

    // Assign staff user to the source station
    const staffUser = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: staffUser.id, stationId: sourceStation.id });
    const staffToken = fixture.auth.makeAccessToken({ userId: staffUser.id, role: "STAFF" });

    // 2. Put 12 bikes in source station and make them AVAILABLE
    const bikes = [];
    for (let i = 0; i < 12; i++) {
      bikes.push(
        await fixture.factories.bike({
          stationId: sourceStation.id,
          status: "AVAILABLE",
        }),
      );
    }

    // Clear and seed min_available_bikes_at_station config to 10
    await fixture.prisma.systemConfig.deleteMany();
    await fixture.prisma.systemConfig.create({
      data: {
        key: "min_available_bikes_at_station",
        value: "10",
      },
    });

    // Requesting 3 bikes would leave 9 bikes available, which is < 10 limit -> Should FAIL
    const failRequestRes = await fixture.app.request("http://test/v1/redistribution-requests", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceStationId: sourceStation.id,
        targetStationId: targetStation.id,
        requestedQuantity: 3,
        reason: "Need extra bikes for high demand",
      }),
    });
    // Should return 400 Bad Request or business error
    expect(failRequestRes.status).toBe(400);
    const failBody = await failRequestRes.json();
    expect(failBody.details?.code).toBe("EXCEEDED_MIN_BIKES_AT_STATION");

    // 3. Now dynamic update the setting min_available_bikes_at_station to 5
    const updateSettingRes = await fixture.app.request("http://test/v1/admin/system-configs/min_available_bikes_at_station", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: "5" }),
    });
    expect(updateSettingRes.status).toBe(200);

    // Requesting 3 bikes leaves 9 AVAILABLE bikes, which is >= 5 limit -> Should SUCCESS
    const successRequestRes = await fixture.app.request("http://test/v1/redistribution-requests", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceStationId: sourceStation.id,
        targetStationId: targetStation.id,
        requestedQuantity: 3,
        reason: "Need extra bikes for high demand",
      }),
    });
    expect(successRequestRes.status).toBe(201);
  });
});
