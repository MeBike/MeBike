import type { StationsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22310";

describe("admin stations routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { StationRepositoryLive } = await import("@/domain/stations/repository/station.repository");
      const { StationServiceLive } = await import("@/domain/stations/services/station.service");
      const { UserRepositoryLive } = await import("@/domain/users/repository/user.repository");
      const { UserServiceLive } = await import("@/domain/users/services/user.service");

      const userRepoLayer = UserRepositoryLive.pipe(Layer.provide(PrismaLive));
      const userServiceLayer = UserServiceLive.pipe(Layer.provide(userRepoLayer));
      const stationRepoLayer = StationRepositoryLive.pipe(Layer.provide(PrismaLive));
      const stationServiceLayer = StationServiceLive.pipe(Layer.provide(stationRepoLayer));

      return Layer.mergeAll(
        userRepoLayer,
        userServiceLayer,
        stationRepoLayer,
        stationServiceLayer,
        PrismaLive,
      );
    },
    seedData: async (_db, prisma) => {
      await prisma.user.create({
        data: {
          id: ADMIN_USER_ID,
          fullName: "Route Admin",
          email: "route-admin-stations@example.com",
          passwordHash: "hash123",
          phoneNumber: null,
          username: null,
          avatarUrl: null,
          locationText: null,
          nfcCardUid: null,
          role: "ADMIN",
          accountStatus: "ACTIVE",
          verifyStatus: "VERIFIED",
        },
      });
    },
  });

  function adminAuthHeader() {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  it("returns only stations without assigned staff", async () => {
    const visibleStation = await fixture.factories.station({ name: "Visible Station" });
    const hiddenStation = await fixture.factories.station({ name: "Hidden Staff Station" });
    const technicianStation = await fixture.factories.station({ name: "Technician Station" });

    const staff = await fixture.factories.user({
      fullname: "Station Staff",
      email: "station-staff@example.com",
      role: "STAFF",
    });
    const technician = await fixture.factories.user({
      fullname: "Station Technician",
      email: "station-technician@example.com",
      role: "TECHNICIAN",
    });

    await fixture.factories.userOrgAssignment({
      userId: staff.id,
      stationId: hiddenStation.id,
    });
    await fixture.factories.userOrgAssignment({
      userId: technician.id,
      stationId: technicianStation.id,
    });

    const response = await fixture.app.request("http://test/v1/admin/stations?page=1&pageSize=20", {
      method: "GET",
      headers: adminAuthHeader(),
    });
    const body = await response.json() as StationsContracts.StationListResponse;

    expect(response.status).toBe(200);
    expect(body.data.map(station => station.id)).toContain(visibleStation.id);
    expect(body.data.map(station => station.id)).toContain(technicianStation.id);
    expect(body.data.map(station => station.id)).not.toContain(hiddenStation.id);
  });
});
