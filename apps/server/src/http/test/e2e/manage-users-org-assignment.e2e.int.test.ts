import type { UsersContracts } from "@mebike/shared";

import { uuidv7 } from "uuidv7";
import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22309";

describe("manage-users org assignment e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { UserRepositoryLive } = await import("@/domain/users/repository/user.repository");
      const { UserStatsRepositoryLive } = await import("@/domain/users/repository/user-stats.repository");
      const { UserServiceLive } = await import("@/domain/users/services/user.service");
      const { UserStatsServiceLive } = await import("@/domain/users/services/user-stats.service");

      const userRepoLayer = UserRepositoryLive.pipe(Layer.provide(PrismaLive));
      const userServiceLayer = UserServiceLive.pipe(Layer.provide(userRepoLayer));
      const userStatsServiceLayer = UserStatsServiceLive.pipe(Layer.provide(UserStatsRepositoryLive));

      return Layer.mergeAll(
        userRepoLayer,
        userServiceLayer,
        UserStatsRepositoryLive,
        userStatsServiceLayer,
        PrismaLive,
      );
    },
    seedData: async (_db, prisma) => {
      await prisma.user.create({
        data: {
          id: ADMIN_USER_ID,
          fullname: "Route Admin",
          email: "route-admin@example.com",
          passwordHash: "hash123",
          phoneNumber: null,
          username: null,
          avatar: null,
          location: null,
          nfcCardUid: null,
          role: "ADMIN",
          verify: "VERIFIED",
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
});
