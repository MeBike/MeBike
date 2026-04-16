import type { TechnicianTeamsContracts } from "@mebike/shared";

import { uuidv7 } from "uuidv7";
import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22311";

describe("admin technician teams routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { TechnicianTeamDepsLive } = await import("@/http/shared/features/technician-team.layers");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(
        TechnicianTeamDepsLive,
        UserDepsLive,
      );
    },
    seedData: async (_db, prisma) => {
      await prisma.user.create({
        data: {
          id: ADMIN_USER_ID,
          fullName: "Route Admin",
          email: "route-admin-technician-teams@example.com",
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

  function authHeader(role: "ADMIN" | "STAFF" = "ADMIN", userId = ADMIN_USER_ID) {
    const token = fixture.auth.makeAccessToken({ userId, role });
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  it("lists technician teams with filters and member counts", async () => {
    const stationA = await fixture.factories.station({ name: "Admin Team Station A" });
    const stationB = await fixture.factories.station({ name: "Admin Team Station B" });
    const matchingTeam = await fixture.factories.technicianTeam({
      name: "Admin Team Available",
      stationId: stationA.id,
    });
    await fixture.factories.technicianTeam({
      name: "Admin Team Unavailable",
      stationId: stationB.id,
      availabilityStatus: "UNAVAILABLE",
    });
    const technician = await fixture.factories.user({
      fullname: "Assigned Tech",
      email: "assigned-tech@example.com",
      role: "TECHNICIAN",
    });

    await fixture.factories.userOrgAssignment({
      userId: technician.id,
      technicianTeamId: matchingTeam.id,
    });

    const response = await fixture.app.request(
      `http://test/v1/admin/technician-teams?stationId=${stationA.id}&availabilityStatus=AVAILABLE`,
      {
        method: "GET",
        headers: authHeader(),
      },
    );
    const body = await response.json() as TechnicianTeamsContracts.TechnicianTeamListResponse;

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.id).toBe(matchingTeam.id);
    expect(body.data[0]?.station.id).toBe(stationA.id);
    expect(body.data[0]?.memberCount).toBe(1);
  });

  it("creates technician team for an existing station", async () => {
    const station = await fixture.factories.station({ name: "Create Team Station" });

    const response = await fixture.app.request("http://test/v1/admin/technician-teams", {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({
        name: "Team Create Route",
        stationId: station.id,
      }),
    });
    const body = await response.json() as TechnicianTeamsContracts.TechnicianTeamSummary;

    expect(response.status).toBe(201);
    expect(body.name).toBe("Team Create Route");
    expect(body.station.id).toBe(station.id);
    expect(body.station.name).toBe("Create Team Station");
    expect(body.availabilityStatus).toBe("AVAILABLE");
    expect(body.memberCount).toBe(0);
  });

  it("rejects create when station does not exist", async () => {
    const response = await fixture.app.request("http://test/v1/admin/technician-teams", {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({
        name: "Broken Team",
        stationId: uuidv7(),
      }),
    });
    const body = await response.json() as TechnicianTeamsContracts.TechnicianTeamErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details.code).toBe("TECHNICIAN_TEAM_STATION_NOT_FOUND");
  });

  it("rejects create for agency station", async () => {
    const station = await fixture.factories.station({
      name: "Agency Team Station",
      stationType: "AGENCY",
    });

    const response = await fixture.app.request("http://test/v1/admin/technician-teams", {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({
        name: "Agency Team",
        stationId: station.id,
      }),
    });
    const body = await response.json() as TechnicianTeamsContracts.TechnicianTeamErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details.code).toBe("TECHNICIAN_TEAM_INTERNAL_STATION_REQUIRED");
    expect(body.details.stationType).toBe("AGENCY");
  });

  it("rejects non-admin access", async () => {
    const staff = await fixture.factories.user({
      fullname: "Staff Route",
      email: "staff-route-technician-teams@example.com",
      role: "STAFF",
    });

    const response = await fixture.app.request("http://test/v1/admin/technician-teams", {
      method: "GET",
      headers: authHeader("STAFF", staff.id),
    });

    expect(response.status).toBe(403);
  });
});
