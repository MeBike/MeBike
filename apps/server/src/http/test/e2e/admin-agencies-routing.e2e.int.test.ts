import type { AgenciesContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "019621f8-e58d-7c57-81fc-0db054f1f001";
const STAFF_USER_ID = "019621f8-e58d-7c57-81fc-0db054f1f002";

describe("admin agencies routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { AgencyDepsLive } = await import("@/http/shared/features/agency.layers");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(
        UserDepsLive,
        AgencyDepsLive,
      );
    },
    seedData: async (_db, prisma) => {
      await prisma.user.createMany({
        data: [
          {
            id: ADMIN_USER_ID,
            fullName: "Route Admin",
            email: "route-admin-agencies@example.com",
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
          {
            id: STAFF_USER_ID,
            fullName: "Route Staff",
            email: "route-staff-agencies@example.com",
            passwordHash: "hash123",
            phoneNumber: null,
            username: null,
            avatarUrl: null,
            locationText: null,
            nfcCardUid: null,
            role: "STAFF",
            accountStatus: "ACTIVE",
            verifyStatus: "VERIFIED",
          },
        ],
      });
    },
  });

  function authHeader(userId: string, role: "ADMIN" | "STAFF") {
    const token = fixture.auth.makeAccessToken({ userId, role });
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  it("lists agencies with filters and pagination for admin", async () => {
    await fixture.prisma.agency.createMany({
      data: [
        {
          id: "019621f8-e58d-7c57-81fc-0db054f1f101",
          name: "Alpha Agency",
          address: "District 1",
          contactPhone: "0281111111",
          status: "ACTIVE",
        },
        {
          id: "019621f8-e58d-7c57-81fc-0db054f1f102",
          name: "Beta Agency",
          address: "District 2",
          contactPhone: "0282222222",
          status: "INACTIVE",
        },
        {
          id: "019621f8-e58d-7c57-81fc-0db054f1f103",
          name: "Gamma Agency",
          address: "District 3",
          contactPhone: "0283333333",
          status: "ACTIVE",
        },
      ],
    });

    const response = await fixture.app.request(
      "http://test/v1/admin/agencies?status=ACTIVE&page=1&pageSize=10&sortBy=name&sortDir=asc",
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const body = await response.json() as AgenciesContracts.AgencyListResponse;

    expect(response.status).toBe(200);
    expect(body.data.map(agency => agency.name)).toEqual([
      "Alpha Agency",
      "Gamma Agency",
    ]);
    expect(body.pagination).toEqual({
      page: 1,
      pageSize: 10,
      total: 2,
      totalPages: 1,
    });
  });

  it("rejects non-admin users", async () => {
    const response = await fixture.app.request("http://test/v1/admin/agencies", {
      method: "GET",
      headers: authHeader(STAFF_USER_ID, "STAFF"),
    });

    expect(response.status).toBe(403);
  });
});
