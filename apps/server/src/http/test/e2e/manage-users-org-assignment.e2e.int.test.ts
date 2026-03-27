import type { UsersContracts } from "@mebike/shared";

import { uuidv7 } from "uuidv7";
import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22309";

describe("manage-users org assignment e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");
      const { UserStatsRepositoryLive } = await import("@/domain/users/repository/user-stats.repository");
      const { UserStatsServiceLive } = await import("@/domain/users/services/user-stats.service");

      const userStatsServiceLayer = UserStatsServiceLive.pipe(Layer.provide(UserStatsRepositoryLive));

      return Layer.mergeAll(
        UserDepsLive,
        UserStatsRepositoryLive,
        userStatsServiceLayer,
      );
    },
    seedData: async (_db, prisma) => {
      await prisma.user.create({
        data: {
          id: ADMIN_USER_ID,
          fullName: "Route Admin",
          email: "route-admin@example.com",
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

  it("creates staff with station assignment and returns it in read endpoints", async () => {
    const station = await fixture.factories.station({ name: "Station Org A" });

    const createResponse = await fixture.app.request("http://test/v1/users/manage-users/create", {
      method: "POST",
      headers: adminAuthHeader(),
      body: JSON.stringify({
        fullname: "Staff Org A",
        email: "staff-org-a@example.com",
        password: "password123",
        role: "STAFF",
        orgAssignment: {
          stationId: station.id,
        },
      }),
    });

    const created = await createResponse.json() as UsersContracts.AdminUserDetailResponse;

    expect(createResponse.status).toBe(201);
    expect(created.role).toBe("STAFF");
    expect(created.orgAssignment?.station?.id).toBe(station.id);

    const detailResponse = await fixture.app.request(
      `http://test/v1/users/manage-users/${created.id}`,
      {
        method: "GET",
        headers: adminAuthHeader(),
      },
    );
    const detail = await detailResponse.json() as UsersContracts.AdminUserDetailResponse;

    expect(detailResponse.status).toBe(200);
    expect(detail.orgAssignment?.station?.id).toBe(station.id);

    const listResponse = await fixture.app.request(
      `http://test/v1/users/manage-users/get-all?page=1&pageSize=20&stationId=${station.id}`,
      {
        method: "GET",
        headers: adminAuthHeader(),
      },
    );
    const list = await listResponse.json() as UsersContracts.AdminUserListResponse;

    expect(listResponse.status).toBe(200);
    expect(list.data.some(user => user.id === created.id)).toBe(true);
  });

  it("returns INVALID_ORG_ASSIGNMENT when manager is assigned to a station", async () => {
    const station = await fixture.factories.station({ name: "Station Org Invalid" });

    const response = await fixture.app.request("http://test/v1/users/manage-users/create", {
      method: "POST",
      headers: adminAuthHeader(),
      body: JSON.stringify({
        fullname: "Manager Invalid",
        email: "manager-invalid@example.com",
        password: "password123",
        role: "MANAGER",
        orgAssignment: {
          stationId: station.id,
        },
      }),
    });

    const body = await response.json() as UsersContracts.UserErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details.code).toBe("INVALID_ORG_ASSIGNMENT");
  });

  it("returns INVALID_ORG_ASSIGNMENT for other invalid role and scope combinations", async () => {
    const station = await fixture.factories.station({ name: "Station Org Invalid User" });
    const teamStation = await fixture.factories.station({ name: "Station Org Invalid Staff" });
    const team = await fixture.prisma.technicianTeam.create({
      data: {
        id: uuidv7(),
        name: "Team Invalid Combo",
        stationId: teamStation.id,
      },
      select: { id: true },
    });

    const staffWithTeamResponse = await fixture.app.request("http://test/v1/users/manage-users/create", {
      method: "POST",
      headers: adminAuthHeader(),
      body: JSON.stringify({
        fullname: "Staff Invalid Team",
        email: "staff-invalid-team@example.com",
        password: "password123",
        role: "STAFF",
        orgAssignment: {
          technicianTeamId: team.id,
        },
      }),
    });

    const userWithStationResponse = await fixture.app.request("http://test/v1/users/manage-users/create", {
      method: "POST",
      headers: adminAuthHeader(),
      body: JSON.stringify({
        fullname: "User Invalid Station",
        email: "user-invalid-station@example.com",
        password: "password123",
        role: "USER",
        orgAssignment: {
          stationId: station.id,
        },
      }),
    });

    const staffWithTeamBody = await staffWithTeamResponse.json() as UsersContracts.UserErrorResponse;
    const userWithStationBody = await userWithStationResponse.json() as UsersContracts.UserErrorResponse;

    expect(staffWithTeamResponse.status).toBe(400);
    expect(staffWithTeamBody.details.code).toBe("INVALID_ORG_ASSIGNMENT");
    expect(userWithStationResponse.status).toBe(400);
    expect(userWithStationBody.details.code).toBe("INVALID_ORG_ASSIGNMENT");
  });

  it("creates technician with team assignment and returns it in filtered reads", async () => {
    const station = await fixture.factories.station({ name: "Station Tech Base" });
    const team = await fixture.prisma.technicianTeam.create({
      data: {
        id: uuidv7(),
        name: "Team Bravo",
        stationId: station.id,
      },
      select: { id: true },
    });

    const createResponse = await fixture.app.request("http://test/v1/users/manage-users/create", {
      method: "POST",
      headers: adminAuthHeader(),
      body: JSON.stringify({
        fullname: "Tech Org A",
        email: "tech-org-a@example.com",
        password: "password123",
        role: "TECHNICIAN",
        orgAssignment: {
          technicianTeamId: team.id,
        },
      }),
    });

    const created = await createResponse.json() as UsersContracts.AdminUserDetailResponse;

    expect(createResponse.status).toBe(201);
    expect(created.role).toBe("TECHNICIAN");
    expect(created.orgAssignment?.technicianTeam?.id).toBe(team.id);

    const listResponse = await fixture.app.request(
      `http://test/v1/users/manage-users/get-all?page=1&pageSize=20&technicianTeamId=${team.id}`,
      {
        method: "GET",
        headers: adminAuthHeader(),
      },
    );
    const list = await listResponse.json() as UsersContracts.AdminUserListResponse;

    expect(listResponse.status).toBe(200);
    expect(list.data.some(user => user.id === created.id)).toBe(true);
  });

  it("returns team member limit error when creating a fourth technician in a team", async () => {
    const station = await fixture.factories.station({ name: "Station Team Limit Create" });
    const team = await fixture.prisma.technicianTeam.create({
      data: {
        id: uuidv7(),
        name: "Team Limit Create",
        stationId: station.id,
      },
      select: { id: true },
    });

    for (let i = 0; i < 3; i++) {
      const user = await fixture.factories.user({
        fullname: `Existing Tech ${i}`,
        email: `existing-tech-${i}@example.com`,
        role: "TECHNICIAN",
      });

      await fixture.factories.userOrgAssignment({
        userId: user.id,
        technicianTeamId: team.id,
      });
    }

    const response = await fixture.app.request("http://test/v1/users/manage-users/create", {
      method: "POST",
      headers: adminAuthHeader(),
      body: JSON.stringify({
        fullname: "Tech Overflow Create",
        email: "tech-overflow-create@example.com",
        password: "password123",
        role: "TECHNICIAN",
        orgAssignment: {
          technicianTeamId: team.id,
        },
      }),
    });

    const body = await response.json() as UsersContracts.UserErrorResponse;

    expect(response.status).toBe(409);
    expect(body.details.code).toBe("TECHNICIAN_TEAM_MEMBER_LIMIT_EXCEEDED");
  });

  it("lists available technician teams and omits full teams", async () => {
    const station = await fixture.factories.station({ name: "Available Teams Station" });
    const otherStation = await fixture.factories.station({ name: "Other Teams Station" });

    const availableTeam = await fixture.prisma.technicianTeam.create({
      data: {
        id: uuidv7(),
        name: "Available Team",
        stationId: station.id,
      },
      select: { id: true },
    });
    const fullTeam = await fixture.prisma.technicianTeam.create({
      data: {
        id: uuidv7(),
        name: "Full Team",
        stationId: station.id,
      },
      select: { id: true },
    });
    const otherStationTeam = await fixture.prisma.technicianTeam.create({
      data: {
        id: uuidv7(),
        name: "Other Station Team",
        stationId: otherStation.id,
      },
      select: { id: true },
    });

    for (let i = 0; i < 3; i++) {
      const user = await fixture.factories.user({
        fullname: `Full Team Member ${i}`,
        email: `full-team-member-${i}@example.com`,
        role: "TECHNICIAN",
      });

      await fixture.factories.userOrgAssignment({
        userId: user.id,
        technicianTeamId: fullTeam.id,
      });
    }

    const response = await fixture.app.request(
      `http://test/v1/admin/technician-teams/available?stationId=${station.id}`,
      {
        method: "GET",
        headers: adminAuthHeader(),
      },
    );

    const body = await response.json() as {
      data: Array<{ id: string; name: string; stationId: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.data.map(item => item.id)).toContain(availableTeam.id);
    expect(body.data.map(item => item.id)).not.toContain(fullTeam.id);
    expect(body.data.map(item => item.id)).not.toContain(otherStationTeam.id);
  });

  it("filters multiple roles in a single admin list request", async () => {
    const staff = await fixture.factories.user({
      fullname: "Staff Multi Role",
      email: "staff-multi-role@example.com",
      role: "STAFF",
    });
    const technician = await fixture.factories.user({
      fullname: "Technician Multi Role",
      email: "technician-multi-role@example.com",
      role: "TECHNICIAN",
    });
    const agency = await fixture.factories.user({
      fullname: "Agency Multi Role",
      email: "agency-multi-role@example.com",
      role: "AGENCY",
    });
    const plainUser = await fixture.factories.user({
      fullname: "User Multi Role",
      email: "user-multi-role@example.com",
      role: "USER",
    });

    const response = await fixture.app.request(
      "http://test/v1/users/manage-users/get-all?page=1&pageSize=20&roles=STAFF,TECHNICIAN,AGENCY",
      {
        method: "GET",
        headers: adminAuthHeader(),
      },
    );

    const body = await response.json() as UsersContracts.AdminUserListResponse;
    const returnedIds = body.data.map(user => user.id);

    expect(response.status).toBe(200);
    expect(returnedIds).toContain(staff.id);
    expect(returnedIds).toContain(technician.id);
    expect(returnedIds).toContain(agency.id);
    expect(returnedIds).not.toContain(plainUser.id);
  });

  it("returns technician summaries with only id and fullName", async () => {
    const technician = await fixture.factories.user({
      fullname: "Alpha Technician",
      email: "alpha-technician@example.com",
      role: "TECHNICIAN",
    });
    await fixture.factories.user({
      fullname: "Regular User",
      email: "regular-user@example.com",
      role: "USER",
    });

    const response = await fixture.app.request("http://test/v1/users/manage-users/technicians", {
      method: "GET",
      headers: adminAuthHeader(),
    });

    const body = await response.json() as UsersContracts.AdminTechnicianListResponse;

    expect(response.status).toBe(200);
    expect(body.data.some(user => user.id === technician.id && user.fullName === "Alpha Technician")).toBe(true);
    expect(body.data.every(user => Object.keys(user).sort().join(",") === "fullName,id")).toBe(true);
    expect(body.data.some(user => user.fullName === "Regular User")).toBe(false);
  });

  it("replaces org assignment and can clear it on update", async () => {
    const station = await fixture.factories.station({ name: "Station Team Base" });
    const team = await fixture.prisma.technicianTeam.create({
      data: {
        id: uuidv7(),
        name: "Team Alpha",
        stationId: station.id,
      },
      select: { id: true, name: true },
    });

    const targetUser = await fixture.factories.user({
      role: "STAFF",
      email: "staff-to-tech@example.com",
    });

    await fixture.prisma.userOrgAssignment.create({
      data: {
        id: uuidv7(),
        userId: targetUser.id,
        stationId: station.id,
      },
    });

    const replaceResponse = await fixture.app.request(
      `http://test/v1/users/manage-users/${targetUser.id}`,
      {
        method: "PATCH",
        headers: adminAuthHeader(),
        body: JSON.stringify({
          role: "TECHNICIAN",
          orgAssignment: {
            technicianTeamId: team.id,
          },
        }),
      },
    );

    const replaced = await replaceResponse.json() as UsersContracts.AdminUserDetailResponse;

    expect(replaceResponse.status).toBe(200);
    expect(replaced.role).toBe("TECHNICIAN");
    expect(replaced.orgAssignment?.technicianTeam?.id).toBe(team.id);
    expect(replaced.orgAssignment?.station).toBeNull();

    const clearResponse = await fixture.app.request(
      `http://test/v1/users/manage-users/${targetUser.id}`,
      {
        method: "PATCH",
        headers: adminAuthHeader(),
        body: JSON.stringify({
          role: "MANAGER",
          orgAssignment: null,
        }),
      },
    );

    const cleared = await clearResponse.json() as UsersContracts.AdminUserDetailResponse;

    expect(clearResponse.status).toBe(200);
    expect(cleared.role).toBe("MANAGER");
    expect(cleared.orgAssignment).toBeNull();
  });

  it("returns team member limit error when updating a user into a full technician team", async () => {
    const station = await fixture.factories.station({ name: "Station Team Limit Update" });
    const team = await fixture.prisma.technicianTeam.create({
      data: {
        id: uuidv7(),
        name: "Team Limit Update",
        stationId: station.id,
      },
      select: { id: true },
    });

    for (let i = 0; i < 3; i++) {
      const user = await fixture.factories.user({
        fullname: `Update Existing Tech ${i}`,
        email: `update-existing-tech-${i}@example.com`,
        role: "TECHNICIAN",
      });

      await fixture.factories.userOrgAssignment({
        userId: user.id,
        technicianTeamId: team.id,
      });
    }

    const targetUser = await fixture.factories.user({
      role: "TECHNICIAN",
      email: "tech-overflow-update@example.com",
    });

    const response = await fixture.app.request(
      `http://test/v1/users/manage-users/${targetUser.id}`,
      {
        method: "PATCH",
        headers: adminAuthHeader(),
        body: JSON.stringify({
          role: "TECHNICIAN",
          orgAssignment: {
            technicianTeamId: team.id,
          },
        }),
      },
    );

    const body = await response.json() as UsersContracts.UserErrorResponse;

    expect(response.status).toBe(409);
    expect(body.details.code).toBe("TECHNICIAN_TEAM_MEMBER_LIMIT_EXCEEDED");
  });

  it("preserves existing org assignment when update omits orgAssignment", async () => {
    const station = await fixture.factories.station({ name: "Station Preserve Base" });
    const targetUser = await fixture.factories.user({
      role: "STAFF",
      email: "staff-preserve@example.com",
    });

    await fixture.prisma.userOrgAssignment.create({
      data: {
        id: uuidv7(),
        userId: targetUser.id,
        stationId: station.id,
      },
    });

    const updateResponse = await fixture.app.request(
      `http://test/v1/users/manage-users/${targetUser.id}`,
      {
        method: "PATCH",
        headers: adminAuthHeader(),
        body: JSON.stringify({
          accountStatus: "BANNED",
        }),
      },
    );

    const updated = await updateResponse.json() as UsersContracts.AdminUserDetailResponse;

    expect(updateResponse.status).toBe(200);
    expect(updated.accountStatus).toBe("BANNED");
    expect(updated.orgAssignment?.station?.id).toBe(station.id);
  });
});
