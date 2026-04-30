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
    expect(body.pagination).toMatchObject({
      page: 1,
      pageSize: 50,
      total: 1,
      totalPages: 1,
    });
  });

  it("paginates technician teams for admin list", async () => {
    const stationA = await fixture.factories.station({ name: "Pagination Station A" });
    const stationB = await fixture.factories.station({ name: "Pagination Station B" });
    const stationC = await fixture.factories.station({ name: "Pagination Station C" });
    await fixture.factories.technicianTeam({
      name: "Admin Team Alpha",
      stationId: stationA.id,
    });
    const betaTeam = await fixture.factories.technicianTeam({
      name: "Admin Team Beta",
      stationId: stationB.id,
    });
    await fixture.factories.technicianTeam({
      name: "Admin Team Gamma",
      stationId: stationC.id,
      availabilityStatus: "UNAVAILABLE",
    });
    const technician = await fixture.factories.user({
      fullname: "Paged Tech",
      email: "paged-tech@example.com",
      role: "TECHNICIAN",
    });

    await fixture.factories.userOrgAssignment({
      userId: technician.id,
      technicianTeamId: betaTeam.id,
    });

    const response = await fixture.app.request(
      "http://test/v1/admin/technician-teams?availabilityStatus=AVAILABLE&page=2&pageSize=1",
      {
        method: "GET",
        headers: authHeader(),
      },
    );
    const body = await response.json() as TechnicianTeamsContracts.TechnicianTeamListResponse;

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.id).toBe(betaTeam.id);
    expect(body.data[0]?.memberCount).toBe(1);
    expect(body.pagination).toMatchObject({
      page: 2,
      pageSize: 1,
      total: 2,
      totalPages: 2,
    });
  });

  it("gets technician team detail with station address and members", async () => {
    const station = await fixture.factories.station({
      name: "Detail Team Station",
      address: "88 Detail Street, Thu Duc, TP.HCM",
    });
    const team = await fixture.factories.technicianTeam({
      name: "Detail Team",
      stationId: station.id,
    });
    const technician = await fixture.factories.user({
      fullname: "Detail Technician",
      email: "detail-technician@example.com",
      role: "TECHNICIAN",
    });

    await fixture.factories.userOrgAssignment({
      userId: technician.id,
      technicianTeamId: team.id,
    });

    const response = await fixture.app.request(`http://test/v1/admin/technician-teams/${team.id}`, {
      method: "GET",
      headers: authHeader(),
    });
    const body = await response.json() as TechnicianTeamsContracts.TechnicianTeamDetailResponse;

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      id: team.id,
      name: "Detail Team",
      station: {
        id: station.id,
        name: "Detail Team Station",
        address: "88 Detail Street, Thu Duc, TP.HCM",
      },
      availabilityStatus: "AVAILABLE",
      memberCount: 1,
    });
    expect(body.data.members).toEqual([
      {
        userId: technician.id,
        fullName: "Detail Technician",
        role: "TECHNICIAN",
      },
    ]);
  });

  it("returns 404 when getting missing technician team", async () => {
    const response = await fixture.app.request(`http://test/v1/admin/technician-teams/${uuidv7()}`, {
      method: "GET",
      headers: authHeader(),
    });
    const body = await response.json() as TechnicianTeamsContracts.TechnicianTeamErrorResponse;

    expect(response.status).toBe(404);
    expect(body.details.code).toBe("TECHNICIAN_TEAM_NOT_FOUND");
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

  it("rejects create when station already has technician team", async () => {
    const station = await fixture.factories.station({ name: "Create Team Duplicate Station" });
    await fixture.factories.technicianTeam({
      name: "Existing Team For Station",
      stationId: station.id,
    });

    const response = await fixture.app.request("http://test/v1/admin/technician-teams", {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({
        name: "Second Team",
        stationId: station.id,
      }),
    });
    const body = await response.json() as TechnicianTeamsContracts.TechnicianTeamErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details.code).toBe("TECHNICIAN_TEAM_STATION_ALREADY_ASSIGNED");
    expect(body.details.stationId).toBe(station.id);
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

  it("updates technician team name and availability", async () => {
    const station = await fixture.factories.station({ name: "Patch Team Station" });
    const team = await fixture.factories.technicianTeam({
      name: "Patch Team Alpha",
      stationId: station.id,
      availabilityStatus: "AVAILABLE",
    });

    const response = await fixture.app.request(`http://test/v1/admin/technician-teams/${team.id}`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({
        name: "Patch Team Beta",
        availabilityStatus: "UNAVAILABLE",
      }),
    });
    const body = await response.json() as TechnicianTeamsContracts.TechnicianTeamSummary;

    expect(response.status).toBe(200);
    expect(body.id).toBe(team.id);
    expect(body.name).toBe("Patch Team Beta");
    expect(body.availabilityStatus).toBe("UNAVAILABLE");
    expect(body.station.id).toBe(station.id);
  });

  it("returns 404 when updating missing technician team", async () => {
    const response = await fixture.app.request(`http://test/v1/admin/technician-teams/${uuidv7()}`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({
        availabilityStatus: "UNAVAILABLE",
      }),
    });
    const body = await response.json() as TechnicianTeamsContracts.TechnicianTeamErrorResponse;

    expect(response.status).toBe(404);
    expect(body.details.code).toBe("TECHNICIAN_TEAM_NOT_FOUND");
  });

  it("returns 400 when update payload is empty", async () => {
    const station = await fixture.factories.station({ name: "Patch Empty Station" });
    const team = await fixture.factories.technicianTeam({
      name: "Patch Empty Team",
      stationId: station.id,
    });

    const response = await fixture.app.request(`http://test/v1/admin/technician-teams/${team.id}`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid request payload",
      details: {
        code: "VALIDATION_ERROR",
      },
    });
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

  it("rejects non-admin update access", async () => {
    const station = await fixture.factories.station({ name: "Patch Forbidden Station" });
    const team = await fixture.factories.technicianTeam({
      name: "Patch Forbidden Team",
      stationId: station.id,
    });
    const staff = await fixture.factories.user({
      fullname: "Patch Staff Route",
      email: "patch-staff-route-technician-teams@example.com",
      role: "STAFF",
    });

    const response = await fixture.app.request(`http://test/v1/admin/technician-teams/${team.id}`, {
      method: "PATCH",
      headers: authHeader("STAFF", staff.id),
      body: JSON.stringify({
        availabilityStatus: "UNAVAILABLE",
      }),
    });

    expect(response.status).toBe(403);
  });
});
