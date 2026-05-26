import type { StationsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("system configs & redistribution alert e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { StationDepsLive, UserDepsLive, PrismaLive } = await import("@/http/shared/providers");

      return Layer.mergeAll(
        StationDepsLive,
        UserDepsLive,
        PrismaLive,
      );
    },
  });

  async function createAdminToken() {
    const user = await fixture.factories.user({ role: "ADMIN" });
    return fixture.auth.makeAccessToken({ userId: user.id, role: "ADMIN" });
  }

  it("validates min_bikes_for_redistribution_alert against half the smallest station capacity", async () => {
    const adminToken = await createAdminToken();

    await fixture.prisma.systemConfig.upsert({
      where: { key: "min_bikes_for_redistribution_alert" },
      update: {},
      create: {
        key: "min_bikes_for_redistribution_alert",
        value: "5",
      },
    });

    const failResponse = await fixture.app.request(
      "http://test/v1/admin/system-configs/min_bikes_for_redistribution_alert",
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: "6" }),
      },
    );

    expect(failResponse.status).toBe(400);
    const failBody = await failResponse.json() as { error: string; details?: { issues?: { message: string }[] } };
    expect(failBody.error).toBe("Invalid value");
    expect(failBody.details?.issues?.[0]?.message).toContain("Value must not be greater than half of the smallest station's capacity");

    const successResponse = await fixture.app.request(
      "http://test/v1/admin/system-configs/min_bikes_for_redistribution_alert",
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: "4" }),
      },
    );

    expect(successResponse.status).toBe(200);
    const successBody = await successResponse.json() as { value: string };
    expect(successBody.value).toBe("4");
  });

  it("sets needsRedistribution correctly based on total bikes in 5 key statuses", async () => {
    const adminToken = await createAdminToken();

    // 1. Create a station with capacity 20
    const station = await fixture.factories.station({
      capacity: 20,
      name: "Alert Station",
    });

    // 2. Set min_bikes_for_redistribution_alert to 3
    const updateResponse = await fixture.app.request(
      "http://test/v1/admin/system-configs/min_bikes_for_redistribution_alert",
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: "3" }),
      },
    );
    expect(updateResponse.status).toBe(200);

    // Helper: fetch station list and check if Alert Station needs redistribution
    const checkNeedsRedistribution = async (): Promise<boolean> => {
      const response = await fixture.app.request(
        "http://test/v1/stations",
        {
          method: "GET",
        },
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as StationsContracts.StationListResponse;
      const alertStation = body.data.find(s => s.id === station.id);
      expect(alertStation).toBeDefined();
      return !!alertStation?.needsRedistribution;
    };

    // 3. Initially, station has 0 bikes in total (0 < 3), so needsRedistribution should be true
    const initiallyNeeds = await checkNeedsRedistribution();
    expect(initiallyNeeds).toBe(true);

    // 4. Create 2 bikes with status 'AVAILABLE' and 'RESERVED' (total 2 < 3 key statuses)
    await fixture.factories.bike({
      bikeNumber: "BIKE-001",
      status: "AVAILABLE",
      stationId: station.id,
    });
    await fixture.factories.bike({
      bikeNumber: "BIKE-002",
      status: "RESERVED",
      stationId: station.id,
    });

    const stillNeeds = await checkNeedsRedistribution();
    expect(stillNeeds).toBe(true);

    // 5. Create another bike with status 'PENDING_DISPATCH' (total 3 >= 3 key statuses)
    await fixture.factories.bike({
      bikeNumber: "BIKE-003",
      status: "PENDING_DISPATCH",
      stationId: station.id,
    });

    const noLongerNeeds = await checkNeedsRedistribution();
    expect(noLongerNeeds).toBe(false);
  });

  describe("redistribution_pending_expire_hours validation", () => {
    async function updateExpireHours(adminToken: string, value: string) {
      return fixture.app.request(
        "http://test/v1/admin/system-configs/redistribution_pending_expire_hours",
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value }),
        },
      );
    }

    async function seedExpireConfig() {
      await fixture.prisma.systemConfig.upsert({
        where: { key: "redistribution_pending_expire_hours" },
        update: {},
        create: { key: "redistribution_pending_expire_hours", value: "24" },
      });
    }

    it("accepts integer hours (e.g. '24')", async () => {
      const adminToken = await createAdminToken();
      await seedExpireConfig();
      const res = await updateExpireHours(adminToken, "24");
      expect(res.status).toBe(200);
      const body = await res.json() as { value: string };
      expect(body.value).toBe("24");
    });

    it("accepts decimal hours (e.g. '1.5')", async () => {
      const adminToken = await createAdminToken();
      await seedExpireConfig();
      const res = await updateExpireHours(adminToken, "1.5");
      expect(res.status).toBe(200);
    });

    it("accepts H:M format (e.g. '24:30')", async () => {
      const adminToken = await createAdminToken();
      await seedExpireConfig();
      const res = await updateExpireHours(adminToken, "24:30");
      expect(res.status).toBe(200);
    });

    it("accepts H:M with only minutes (e.g. '0:45')", async () => {
      const adminToken = await createAdminToken();
      await seedExpireConfig();
      const res = await updateExpireHours(adminToken, "0:45");
      expect(res.status).toBe(200);
    });

    it("rejects zero duration ('0')", async () => {
      const adminToken = await createAdminToken();
      await seedExpireConfig();
      const res = await updateExpireHours(adminToken, "0");
      expect(res.status).toBe(400);
    });

    it("rejects zero H:M duration ('0:00')", async () => {
      const adminToken = await createAdminToken();
      await seedExpireConfig();
      const res = await updateExpireHours(adminToken, "0:00");
      expect(res.status).toBe(400);
    });

    it("rejects negative hours ('-1')", async () => {
      const adminToken = await createAdminToken();
      await seedExpireConfig();
      const res = await updateExpireHours(adminToken, "-1");
      expect(res.status).toBe(400);
    });

    it("rejects invalid minutes in H:M (e.g. '1:60')", async () => {
      const adminToken = await createAdminToken();
      await seedExpireConfig();
      const res = await updateExpireHours(adminToken, "1:60");
      expect(res.status).toBe(400);
    });

    it("rejects garbage text ('abc')", async () => {
      const adminToken = await createAdminToken();
      await seedExpireConfig();
      const res = await updateExpireHours(adminToken, "abc");
      expect(res.status).toBe(400);
    });

    it("rejects duration exceeding 24h as integer ('25')", async () => {
      const adminToken = await createAdminToken();
      await seedExpireConfig();
      const res = await updateExpireHours(adminToken, "25");
      expect(res.status).toBe(400);
    });

    it("rejects duration exceeding 24h in H:M format ('24:01')", async () => {
      const adminToken = await createAdminToken();
      await seedExpireConfig();
      const res = await updateExpireHours(adminToken, "24:01");
      expect(res.status).toBe(400);
    });

    it("accepts exactly 24h ('24')", async () => {
      const adminToken = await createAdminToken();
      await seedExpireConfig();
      const res = await updateExpireHours(adminToken, "24");
      expect(res.status).toBe(200);
    });

    it("accepts exactly 24h in H:M format ('24:00')", async () => {
      const adminToken = await createAdminToken();
      await seedExpireConfig();
      const res = await updateExpireHours(adminToken, "24:00");
      expect(res.status).toBe(200);
    });
  });
});
