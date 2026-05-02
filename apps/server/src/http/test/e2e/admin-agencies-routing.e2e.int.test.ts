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

  async function updateAgency(
    agencyId: string,
    body: Record<string, unknown>,
    init?: { userId?: string; role?: "ADMIN" | "STAFF" },
  ) {
    return fixture.app.request(`http://test/v1/admin/agencies/${agencyId}`, {
      method: "PATCH",
      headers: init?.userId && init?.role
        ? authHeader(init.userId, init.role)
        : {
            "Content-Type": "application/json",
          },
      body: JSON.stringify(body),
    });
  }

  async function updateAgencyStatus(
    agencyId: string,
    body: Record<string, unknown>,
    init?: { userId?: string; role?: "ADMIN" | "STAFF" },
  ) {
    return fixture.app.request(`http://test/v1/admin/agencies/${agencyId}/status`, {
      method: "PATCH",
      headers: init?.userId && init?.role
        ? authHeader(init.userId, init.role)
        : {
            "Content-Type": "application/json",
          },
      body: JSON.stringify(body),
    });
  }

  it("lists agencies with filters and pagination for admin", async () => {
    await fixture.prisma.agency.createMany({
      data: [
        {
          id: "019621f8-e58d-7c57-81fc-0db054f1f101",
          name: "Alpha Agency",
          contactPhone: "0281111111",
          status: "ACTIVE",
        },
        {
          id: "019621f8-e58d-7c57-81fc-0db054f1f102",
          name: "Beta Agency",
          contactPhone: "0282222222",
          status: "INACTIVE",
        },
        {
          id: "019621f8-e58d-7c57-81fc-0db054f1f103",
          name: "Gamma Agency",
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

  it("gets agency detail for admin", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        id: "019621f8-e58d-7c57-81fc-0db054f1f111",
        name: "Detail Agency",
        contactPhone: "0285555555",
        status: "SUSPENDED",
      },
    });

    const response = await fixture.app.request(`http://test/v1/admin/agencies/${agency.id}`, {
      method: "GET",
      headers: authHeader(ADMIN_USER_ID, "ADMIN"),
    });
    const body = await response.json() as AgenciesContracts.AgencyDetailResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      id: agency.id,
      name: "Detail Agency",
      contactPhone: "0285555555",
      status: "SUSPENDED",
      station: null,
      createdAt: agency.createdAt.toISOString(),
      updatedAt: agency.updatedAt.toISOString(),
    });
  });

  it("updates agency details for admin", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        id: "019621f8-e58d-7c57-81fc-0db054f1f121",
        name: "Legacy Agency",
        contactPhone: "0281234567",
        status: "ACTIVE",
      },
    });

    const response = await updateAgency(
      agency.id,
      {
        name: "Updated Agency Name",
        contactPhone: "0912345678",
        status: "INACTIVE",
      },
      { userId: ADMIN_USER_ID, role: "ADMIN" },
    );
    const body = await response.json() as AgenciesContracts.AgencyUpdateResponse;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: agency.id,
      name: "Updated Agency Name",
      contactPhone: "0912345678",
      status: "INACTIVE",
      station: null,
    });

    const saved = await fixture.prisma.agency.findUnique({
      where: { id: agency.id },
      select: {
        id: true,
        name: true,
        contactPhone: true,
        status: true,
      },
    });

    expect(saved).toEqual({
      id: agency.id,
      name: "Updated Agency Name",
      contactPhone: "0912345678",
      status: "INACTIVE",
    });
  });

  it("allows admin to clear nullable agency fields", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        id: "019621f8-e58d-7c57-81fc-0db054f1f122",
        name: "Clearable Agency",
        contactPhone: "0911222333",
        status: "ACTIVE",
      },
    });

    const response = await updateAgency(
      agency.id,
      {
        contactPhone: "   ",
      },
      { userId: ADMIN_USER_ID, role: "ADMIN" },
    );
    const body = await response.json() as AgenciesContracts.AgencyUpdateResponse;

    expect(response.status).toBe(200);
    expect(body.contactPhone).toBeNull();
    expect(body.station).toBeNull();

    const saved = await fixture.prisma.agency.findUnique({
      where: { id: agency.id },
      select: {
        contactPhone: true,
      },
    });

    expect(saved).toEqual({
      contactPhone: null,
    });
  });

  it("updates agency status for admin", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        id: "019621f8-e58d-7c57-81fc-0db054f1f127",
        name: "Status Agency",
        contactPhone: "0281010101",
        status: "ACTIVE",
      },
    });

    const response = await updateAgencyStatus(
      agency.id,
      {
        status: "BANNED",
      },
      { userId: ADMIN_USER_ID, role: "ADMIN" },
    );
    const body = await response.json() as AgenciesContracts.AgencyUpdateStatusResponse;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: agency.id,
      name: "Status Agency",
      contactPhone: "0281010101",
      status: "BANNED",
      station: null,
    });

    const saved = await fixture.prisma.agency.findUnique({
      where: { id: agency.id },
      select: {
        status: true,
      },
    });

    expect(saved).toEqual({
      status: "BANNED",
    });
  });

  it("returns 404 when agency detail does not exist", async () => {
    const missingAgencyId = "019621f8-e58d-7c57-81fc-0db054f1f199";

    const response = await fixture.app.request(`http://test/v1/admin/agencies/${missingAgencyId}`, {
      method: "GET",
      headers: authHeader(ADMIN_USER_ID, "ADMIN"),
    });
    const body = await response.json() as AgenciesContracts.AgencyErrorResponse;

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Agency not found",
      details: {
        code: "AGENCY_NOT_FOUND",
        agencyId: missingAgencyId,
      },
    });
  });

  it("returns 404 when updating an unknown agency", async () => {
    const missingAgencyId = "019621f8-e58d-7c57-81fc-0db054f1f198";

    const response = await updateAgency(
      missingAgencyId,
      { name: "Unknown Agency" },
      { userId: ADMIN_USER_ID, role: "ADMIN" },
    );
    const body = await response.json() as AgenciesContracts.AgencyErrorResponse;

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Agency not found",
      details: {
        code: "AGENCY_NOT_FOUND",
        agencyId: missingAgencyId,
      },
    });
  });

  it("returns 404 when updating status of an unknown agency", async () => {
    const missingAgencyId = "019621f8-e58d-7c57-81fc-0db054f1f197";

    const response = await updateAgencyStatus(
      missingAgencyId,
      { status: "INACTIVE" },
      { userId: ADMIN_USER_ID, role: "ADMIN" },
    );
    const body = await response.json() as AgenciesContracts.AgencyErrorResponse;

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Agency not found",
      details: {
        code: "AGENCY_NOT_FOUND",
        agencyId: missingAgencyId,
      },
    });
  });

  it("returns 400 for invalid agency id", async () => {
    const response = await fixture.app.request("http://test/v1/admin/agencies/not-a-uuid", {
      method: "GET",
      headers: authHeader(ADMIN_USER_ID, "ADMIN"),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid request payload",
      details: {
        code: "VALIDATION_ERROR",
      },
    });
  });

  it("returns 400 for invalid agency id on update", async () => {
    const response = await updateAgency(
      "not-a-uuid",
      { name: "Invalid Agency Id" },
      { userId: ADMIN_USER_ID, role: "ADMIN" },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid request payload",
      details: {
        code: "VALIDATION_ERROR",
      },
    });
  });

  it("returns 400 for invalid update payload", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        id: "019621f8-e58d-7c57-81fc-0db054f1f123",
        name: "Validation Agency",
        contactPhone: "0284444444",
        status: "ACTIVE",
      },
    });

    const response = await updateAgency(
      agency.id,
      {
        contactPhone: "123",
      },
      { userId: ADMIN_USER_ID, role: "ADMIN" },
    );
    const body = await response.json() as {
      error: string;
      details?: {
        code?: string;
        issues?: Array<{ path?: string; message: string }>;
      };
    };

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
    expect(body.details?.issues?.some(issue => issue.path?.includes("contactPhone"))).toBe(true);
  });

  it("returns 400 for invalid status update payload", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        id: "019621f8-e58d-7c57-81fc-0db054f1f128",
        name: "Status Validation Agency",
        contactPhone: "0282020202",
        status: "ACTIVE",
      },
    });

    const response = await updateAgencyStatus(
      agency.id,
      {
        status: "DISABLED",
      },
      { userId: ADMIN_USER_ID, role: "ADMIN" },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid request payload",
      details: {
        code: "VALIDATION_ERROR",
      },
    });
  });

  it("returns 400 when update payload is empty", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        id: "019621f8-e58d-7c57-81fc-0db054f1f124",
        name: "Empty Body Agency",
        contactPhone: "0287777777",
        status: "ACTIVE",
      },
    });

    const response = await updateAgency(
      agency.id,
      {},
      { userId: ADMIN_USER_ID, role: "ADMIN" },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid request payload",
      details: {
        code: "VALIDATION_ERROR",
      },
    });
  });

  it("rejects non-admin users", async () => {
    const response = await fixture.app.request("http://test/v1/admin/agencies", {
      method: "GET",
      headers: authHeader(STAFF_USER_ID, "STAFF"),
    });

    expect(response.status).toBe(403);
  });

  it("rejects non-admin users from agency update", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        id: "019621f8-e58d-7c57-81fc-0db054f1f125",
        name: "Forbidden Update Agency",
        contactPhone: "0288888888",
        status: "ACTIVE",
      },
    });

    const response = await updateAgency(
      agency.id,
      { name: "Should Not Update" },
      { userId: STAFF_USER_ID, role: "STAFF" },
    );

    expect(response.status).toBe(403);
  });

  it("rejects non-admin users from agency status update", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        id: "019621f8-e58d-7c57-81fc-0db054f1f129",
        name: "Forbidden Status Agency",
        contactPhone: "0283030303",
        status: "ACTIVE",
      },
    });

    const response = await updateAgencyStatus(
      agency.id,
      { status: "SUSPENDED" },
      { userId: STAFF_USER_ID, role: "STAFF" },
    );

    expect(response.status).toBe(403);
  });

  it("rejects non-admin users from agency detail", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        id: "019621f8-e58d-7c57-81fc-0db054f1f112",
        name: "Forbidden Agency",
        contactPhone: "0286666666",
        status: "ACTIVE",
      },
    });

    const response = await fixture.app.request(`http://test/v1/admin/agencies/${agency.id}`, {
      method: "GET",
      headers: authHeader(STAFF_USER_ID, "STAFF"),
    });

    expect(response.status).toBe(403);
  });

  it("requires authentication for agency update", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        id: "019621f8-e58d-7c57-81fc-0db054f1f126",
        name: "Auth Update Agency",
        contactPhone: "0289999999",
        status: "ACTIVE",
      },
    });

    const response = await updateAgency(agency.id, { name: "No Auth" });

    expect(response.status).toBe(401);
  });

  it("requires authentication for agency status update", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        id: "019621f8-e58d-7c57-81fc-0db054f1f130",
        name: "Auth Status Agency",
        contactPhone: "0284040404",
        status: "ACTIVE",
      },
    });

    const response = await updateAgencyStatus(agency.id, { status: "INACTIVE" });

    expect(response.status).toBe(401);
  });
});
