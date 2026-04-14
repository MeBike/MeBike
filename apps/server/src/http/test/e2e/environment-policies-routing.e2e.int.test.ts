import type { EnvironmentContracts, ServerErrorResponse } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018fa100-0000-7000-8000-000000000001";
const REGULAR_USER_ID = "018fa100-0000-7000-8000-000000000002";

describe("environment policies routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { EnvironmentPolicyRepositoryLive } = await import("@/domain/environment/repository/environment-policy.repository");
      const { EnvironmentPolicyServiceLive } = await import("@/domain/environment/services/environment-policy.service");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      const environmentPolicyRepoLayer = EnvironmentPolicyRepositoryLive.pipe(
        Layer.provide(PrismaLive),
      );
      const environmentPolicyServiceLayer = EnvironmentPolicyServiceLive.pipe(
        Layer.provide(environmentPolicyRepoLayer),
      );

      return Layer.mergeAll(
        UserDepsLive,
        environmentPolicyRepoLayer,
        environmentPolicyServiceLayer,
        PrismaLive,
      );
    },
    seedBase: false,
    seedData: async (_db, prisma) => {
      await prisma.user.createMany({
        data: [
          {
            id: ADMIN_USER_ID,
            fullName: "Environment Admin",
            email: "environment-admin@example.com",
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
            id: REGULAR_USER_ID,
            fullName: "Environment User",
            email: "environment-user@example.com",
            passwordHash: "hash123",
            phoneNumber: null,
            username: null,
            avatarUrl: null,
            locationText: null,
            nfcCardUid: null,
            role: "USER",
            accountStatus: "ACTIVE",
            verifyStatus: "VERIFIED",
          },
        ],
      });
    },
  });

  function adminHeaders() {
    return {
      ...fixture.auth.makeAuthHeader({ userId: ADMIN_USER_ID, role: "ADMIN" }),
      "Content-Type": "application/json",
    };
  }

  function userHeaders() {
    return {
      ...fixture.auth.makeAuthHeader({ userId: REGULAR_USER_ID, role: "USER" }),
      "Content-Type": "application/json",
    };
  }

  async function insertEnvironmentPolicy(input: {
    id: string;
    name: string;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
    activeFrom: Date | null;
    activeTo: Date | null;
    createdAt?: Date;
    updatedAt: Date;
    formulaConfig: Record<string, unknown>;
  }) {
    await fixture.prisma.$executeRaw`
      INSERT INTO "public"."environmental_impact_policies"
        (
          "id",
          "name",
          "average_speed_kmh",
          "co2_saved_per_km",
          "status",
          "active_from",
          "active_to",
          "formula_config",
          "created_at",
          "updated_at"
        )
      VALUES
        (
          ${input.id}::uuid,
          ${input.name},
          ${12},
          ${75},
          ${input.status}::"AccountStatus",
          ${input.activeFrom},
          ${input.activeTo},
          ${JSON.stringify(input.formulaConfig)}::jsonb,
          ${input.createdAt ?? new Date(input.updatedAt.getTime() - 1000)},
          ${input.updatedAt}
        )
    `;
  }

  it("creates an inactive environment policy as admin", async () => {
    const response = await fixture.app.request("http://test/environment/policies", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        name: "  Default Environment Policy v1  ",
        average_speed_kmh: 12.345,
        co2_saved_per_km: 75.12345,
        return_scan_buffer_minutes: 4,
        confidence_factor: 0.856,
      }),
    });
    const body = await response.json() as EnvironmentContracts.EnvironmentPolicy;

    expect(response.status).toBe(201);
    expect(body.name).toBe("Default Environment Policy v1");
    expect(body.average_speed_kmh).toBe(12.35);
    expect(body.co2_saved_per_km).toBe(75.1235);
    expect(body.co2_saved_per_km_unit).toBe("gCO2e/km");
    expect(body.status).toBe("INACTIVE");
    expect(body.active_from).toBeNull();
    expect(body.active_to).toBeNull();
    expect(body.formula_config).toEqual({
      return_scan_buffer_minutes: 4,
      confidence_factor: 0.86,
      display_unit: "gCO2e",
      formula_version: "PHASE_1_TIME_SPEED",
      distance_source: "TIME_SPEED",
    });

    const [dbPolicy] = await fixture.prisma.$queryRaw<
      Array<{
        status: string;
        active_from: Date | null;
        active_to: Date | null;
        formula_config: unknown;
      }>
    >`
      SELECT
        "status",
        "active_from",
        "active_to",
        "formula_config"
      FROM "public"."environmental_impact_policies"
      WHERE "id" = ${body.id}::uuid
    `;

    expect(dbPolicy?.status).toBe("INACTIVE");
    expect(dbPolicy?.active_from).toBeNull();
    expect(dbPolicy?.active_to).toBeNull();
    expect(dbPolicy?.formula_config).toEqual(body.formula_config);
  });

  it("rejects unauthenticated requests", async () => {
    const response = await fixture.app.request("http://test/environment/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Default Environment Policy v1",
        average_speed_kmh: 12,
        co2_saved_per_km: 75,
      }),
    });

    expect(response.status).toBe(401);
  });

  it("rejects non-admin users", async () => {
    const response = await fixture.app.request("http://test/environment/policies", {
      method: "POST",
      headers: userHeaders(),
      body: JSON.stringify({
        name: "Default Environment Policy v1",
        average_speed_kmh: 12,
        co2_saved_per_km: 75,
      }),
    });

    expect(response.status).toBe(403);
  });

  it("returns an empty environment policy list when no policies exist", async () => {
    const response = await fixture.app.request("http://test/environment/policies", {
      method: "GET",
      headers: adminHeaders(),
    });
    const body = await response.json() as EnvironmentContracts.EnvironmentPolicyListResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
    });
  });

  it("lists environment policies for admin with default pagination and normalized response fields", async () => {
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000011",
      name: "Older Environment Policy",
      status: "INACTIVE",
      activeFrom: null,
      activeTo: null,
      createdAt: new Date("2026-04-15T01:00:00.000Z"),
      updatedAt: new Date("2026-04-15T01:01:00.000Z"),
      formulaConfig: {},
    });
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000012",
      name: "Newest Environment Policy",
      status: "ACTIVE",
      activeFrom: new Date("2026-04-15T00:00:00.000Z"),
      activeTo: null,
      createdAt: new Date("2026-04-15T02:00:00.000Z"),
      updatedAt: new Date("2026-04-15T02:01:00.000Z"),
      formulaConfig: {
        confidence_factor: 0.9,
      },
    });

    const response = await fixture.app.request("http://test/environment/policies", {
      method: "GET",
      headers: adminHeaders(),
    });
    const body = await response.json() as EnvironmentContracts.EnvironmentPolicyListResponse;

    expect(response.status).toBe(200);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(20);
    expect(body.totalItems).toBe(2);
    expect(body.totalPages).toBe(1);
    expect(body.items.map(policy => policy.name)).toEqual([
      "Newest Environment Policy",
      "Older Environment Policy",
    ]);
    expect(body.items[0]).toMatchObject({
      id: "018fa200-0000-7000-8000-000000000012",
      status: "ACTIVE",
      co2_saved_per_km_unit: "gCO2e/km",
      formula_config: {
        return_scan_buffer_minutes: 3,
        confidence_factor: 0.9,
        display_unit: "gCO2e",
        formula_version: "PHASE_1_TIME_SPEED",
        distance_source: "TIME_SPEED",
      },
    });
    expect(body.items[1]?.formula_config).toEqual({
      return_scan_buffer_minutes: 3,
      confidence_factor: 0.85,
      display_unit: "gCO2e",
      formula_version: "PHASE_1_TIME_SPEED",
      distance_source: "TIME_SPEED",
    });
  });

  it("filters environment policies by status and case-insensitive trimmed name search", async () => {
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000021",
      name: "Default Environment Policy",
      status: "ACTIVE",
      activeFrom: null,
      activeTo: null,
      updatedAt: new Date("2026-04-15T01:00:00.000Z"),
      formulaConfig: {},
    });
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000022",
      name: "Default Draft Policy",
      status: "INACTIVE",
      activeFrom: null,
      activeTo: null,
      updatedAt: new Date("2026-04-15T02:00:00.000Z"),
      formulaConfig: {},
    });
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000023",
      name: "Other Active Policy",
      status: "ACTIVE",
      activeFrom: null,
      activeTo: null,
      updatedAt: new Date("2026-04-15T03:00:00.000Z"),
      formulaConfig: {},
    });

    const response = await fixture.app.request(
      "http://test/environment/policies?status=ACTIVE&search=%20default%20",
      {
        method: "GET",
        headers: adminHeaders(),
      },
    );
    const body = await response.json() as EnvironmentContracts.EnvironmentPolicyListResponse;

    expect(response.status).toBe(200);
    expect(body.totalItems).toBe(1);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.name).toBe("Default Environment Policy");
  });

  it("paginates and sorts environment policies by requested field and order", async () => {
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000031",
      name: "Charlie Environment Policy",
      status: "INACTIVE",
      activeFrom: null,
      activeTo: null,
      updatedAt: new Date("2026-04-15T01:00:00.000Z"),
      formulaConfig: {},
    });
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000032",
      name: "Alpha Environment Policy",
      status: "INACTIVE",
      activeFrom: null,
      activeTo: null,
      updatedAt: new Date("2026-04-15T02:00:00.000Z"),
      formulaConfig: {},
    });
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000033",
      name: "Bravo Environment Policy",
      status: "INACTIVE",
      activeFrom: null,
      activeTo: null,
      updatedAt: new Date("2026-04-15T03:00:00.000Z"),
      formulaConfig: {},
    });

    const response = await fixture.app.request(
      "http://test/environment/policies?page=2&pageSize=1&sortBy=name&sortOrder=asc",
      {
        method: "GET",
        headers: adminHeaders(),
      },
    );
    const body = await response.json() as EnvironmentContracts.EnvironmentPolicyListResponse;

    expect(response.status).toBe(200);
    expect(body.page).toBe(2);
    expect(body.pageSize).toBe(1);
    expect(body.totalItems).toBe(3);
    expect(body.totalPages).toBe(3);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.name).toBe("Bravo Environment Policy");
  });

  it("rejects unauthenticated environment policy list reads", async () => {
    const response = await fixture.app.request("http://test/environment/policies", {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });

  it("rejects non-admin environment policy list reads", async () => {
    const response = await fixture.app.request("http://test/environment/policies", {
      method: "GET",
      headers: userHeaders(),
    });

    expect(response.status).toBe(403);
  });

  it("rejects invalid environment policy list query params", async () => {
    const invalidQueries = [
      "page=0",
      "pageSize=0",
      "pageSize=101",
      "status=DELETED",
      "sortBy=bad",
      "sortOrder=up",
    ];

    for (const query of invalidQueries) {
      const response = await fixture.app.request(`http://test/environment/policies?${query}`, {
        method: "GET",
        headers: adminHeaders(),
      });
      const body = await response.json() as ServerErrorResponse;

      expect(response.status).toBe(400);
      expect(body.details?.code).toBe("VALIDATION_ERROR");
    }
  });

  it("returns 404 when no active environment policy exists", async () => {
    const response = await fixture.app.request("http://test/environment/policies/active", {
      method: "GET",
      headers: adminHeaders(),
    });
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(404);
    expect(body.error).toBe("No active environment policy found");
    expect(body.details?.code).toBe("ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND");
  });

  it("returns the active environment policy as admin", async () => {
    const activeFrom = new Date(Date.now() - 60_000);
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000001",
      name: "Active Environment Policy",
      status: "ACTIVE",
      activeFrom,
      activeTo: null,
      updatedAt: new Date(),
      formulaConfig: {
        confidence_factor: 0.9,
      },
    });

    const response = await fixture.app.request("http://test/environment/policies/active", {
      method: "GET",
      headers: adminHeaders(),
    });
    const body = await response.json() as EnvironmentContracts.EnvironmentPolicy;

    expect(response.status).toBe(200);
    expect(body.id).toBe("018fa200-0000-7000-8000-000000000001");
    expect(body.name).toBe("Active Environment Policy");
    expect(body.status).toBe("ACTIVE");
    expect(body.active_from).toBe(activeFrom.toISOString());
    expect(body.active_to).toBeNull();
    expect(body.co2_saved_per_km_unit).toBe("gCO2e/km");
    expect(body.formula_config).toEqual({
      return_scan_buffer_minutes: 3,
      confidence_factor: 0.9,
      display_unit: "gCO2e",
      formula_version: "PHASE_1_TIME_SPEED",
      distance_source: "TIME_SPEED",
    });
  });

  it("falls back to the newest valid active policy when legacy data has multiple active rows", async () => {
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000002",
      name: "Older Active Environment Policy",
      status: "ACTIVE",
      activeFrom: new Date(Date.now() - 120_000),
      activeTo: null,
      updatedAt: new Date(Date.now() - 10_000),
      formulaConfig: {
        return_scan_buffer_minutes: 3,
        confidence_factor: 0.85,
        display_unit: "gCO2e",
        formula_version: "PHASE_1_TIME_SPEED",
        distance_source: "TIME_SPEED",
      },
    });
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000003",
      name: "Newest Active Environment Policy",
      status: "ACTIVE",
      activeFrom: new Date(Date.now() - 60_000),
      activeTo: null,
      updatedAt: new Date(Date.now() - 20_000),
      formulaConfig: {
        return_scan_buffer_minutes: 4,
        confidence_factor: 0.8,
        display_unit: "gCO2e",
        formula_version: "PHASE_1_TIME_SPEED",
        distance_source: "TIME_SPEED",
      },
    });

    const response = await fixture.app.request("http://test/environment/policies/active", {
      method: "GET",
      headers: adminHeaders(),
    });
    const body = await response.json() as EnvironmentContracts.EnvironmentPolicy;

    expect(response.status).toBe(200);
    expect(body.id).toBe("018fa200-0000-7000-8000-000000000003");
    expect(body.name).toBe("Newest Active Environment Policy");
  });

  it("rejects unauthenticated active policy reads", async () => {
    const response = await fixture.app.request("http://test/environment/policies/active", {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });

  it("rejects non-admin active policy reads", async () => {
    const response = await fixture.app.request("http://test/environment/policies/active", {
      method: "GET",
      headers: userHeaders(),
    });

    expect(response.status).toBe(403);
  });

  it("rejects invalid input", async () => {
    const invalidBodies = [
      {
        name: "   ",
        average_speed_kmh: 12,
        co2_saved_per_km: 75,
      },
      {
        name: "Bad average speed",
        average_speed_kmh: 0,
        co2_saved_per_km: 75,
      },
      {
        name: "Bad CO2 factor",
        average_speed_kmh: 12,
        co2_saved_per_km: -1,
      },
      {
        name: "Bad return buffer",
        average_speed_kmh: 12,
        co2_saved_per_km: 75,
        return_scan_buffer_minutes: 1.5,
      },
      {
        name: "Bad confidence",
        average_speed_kmh: 12,
        co2_saved_per_km: 75,
        confidence_factor: 0,
      },
      {
        name: "Cannot activate in create",
        average_speed_kmh: 12,
        co2_saved_per_km: 75,
        status: "ACTIVE",
      },
    ];

    for (const invalidBody of invalidBodies) {
      const response = await fixture.app.request("http://test/environment/policies", {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify(invalidBody),
      });
      const body = await response.json() as ServerErrorResponse;

      expect(response.status).toBe(400);
      expect(body.details?.code).toBe("VALIDATION_ERROR");
    }
  });
});
