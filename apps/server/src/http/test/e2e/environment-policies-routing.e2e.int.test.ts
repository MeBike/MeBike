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
