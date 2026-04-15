import type { EnvironmentContracts, ServerErrorResponse } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018fa100-0000-7000-8000-000000000001";
const REGULAR_USER_ID = "018fa100-0000-7000-8000-000000000002";
const OTHER_USER_ID = "018fa100-0000-7000-8000-000000000003";

describe("environment policies routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { EnvironmentDepsLive } = await import("@/http/shared/features/environment.layers");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(
        UserDepsLive,
        EnvironmentDepsLive,
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
          {
            id: OTHER_USER_ID,
            fullName: "Other Environment User",
            email: "other-environment-user@example.com",
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

  function otherUserHeaders() {
    return {
      ...fixture.auth.makeAuthHeader({ userId: OTHER_USER_ID, role: "USER" }),
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

  async function insertActiveEnvironmentPolicy() {
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000101",
      name: "Default Environment Policy v1",
      status: "ACTIVE",
      activeFrom: new Date(Date.now() - 60_000),
      activeTo: null,
      updatedAt: new Date(),
      formulaConfig: {
        return_scan_buffer_minutes: 3,
        confidence_factor: 0.85,
        display_unit: "gCO2e",
        formula_version: "PHASE_1_TIME_SPEED",
        distance_source: "TIME_SPEED",
      },
    });
  }

  async function createRentalForImpact(input: {
    id?: string;
    userId?: string;
    status?: "RENTED" | "COMPLETED" | "CANCELLED";
    duration?: number | null;
    startTime?: Date;
    endTime?: Date | null;
  } = {}) {
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id });
    const rental = await fixture.factories.rental({
      id: input.id,
      userId: input.userId ?? REGULAR_USER_ID,
      bikeId: bike.id,
      startStationId: station.id,
      endStationId: input.status === "COMPLETED" ? station.id : null,
      startTime: input.startTime ?? new Date("2026-04-15T01:00:00.000Z"),
      endTime: input.endTime ?? new Date("2026-04-15T01:23:00.000Z"),
      duration: input.duration ?? 23,
      status: input.status ?? "COMPLETED",
    });

    return rental;
  }

  async function calculateEnvironmentImpact(rentalId: string) {
    const response = await fixture.app.request(
      `http://test/internal/environment/calculate-from-rental/${rentalId}`,
      {
        method: "POST",
        headers: adminHeaders(),
      },
    );

    expect(response.status).toBe(200);
    return await response.json() as EnvironmentContracts.EnvironmentImpact;
  }

  async function setImpactCalculatedAt(rentalId: string, calculatedAt: Date) {
    await fixture.prisma.environmentalImpactStat.update({
      where: { rentalId },
      data: { calculatedAt },
    });
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

  it("calculates environment impact for a completed rental as admin", async () => {
    await insertActiveEnvironmentPolicy();
    const rental = await createRentalForImpact();

    const response = await fixture.app.request(
      `http://test/internal/environment/calculate-from-rental/${rental.id}`,
      {
        method: "POST",
        headers: adminHeaders(),
      },
    );
    const body = await response.json() as EnvironmentContracts.EnvironmentImpact;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      user_id: REGULAR_USER_ID,
      rental_id: rental.id,
      policy_id: "018fa200-0000-7000-8000-000000000101",
      estimated_distance_km: 4,
      co2_saved: 255,
      co2_saved_unit: "gCO2e",
      already_calculated: false,
      policy_snapshot: {
        policy_name: "Default Environment Policy v1",
        average_speed_kmh: 12,
        co2_saved_per_km: 75,
        co2_saved_per_km_unit: "gCO2e/km",
        return_scan_buffer_minutes: 3,
        confidence_factor: 0.85,
        raw_rental_minutes: 23,
        effective_ride_minutes: 20,
        estimated_distance_km: 4,
        co2_saved: 255,
        co2_saved_unit: "gCO2e",
        distance_source: "TIME_SPEED",
        formula_version: "PHASE_1_TIME_SPEED",
      },
    });

    const [dbImpact] = await fixture.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count
      FROM "public"."environmental_impact_stats"
      WHERE "rental_id" = ${rental.id}::uuid
    `;

    expect(Number(dbImpact?.count ?? 0)).toBe(1);
  });

  it("returns zero environment summary when the current user has no impact records", async () => {
    const response = await fixture.app.request("http://test/environment/me/summary", {
      method: "GET",
      headers: userHeaders(),
    });
    const body = await response.json() as EnvironmentContracts.EnvironmentSummary;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      total_trips_counted: 0,
      total_estimated_distance_km: 0,
      total_co2_saved: 0,
      co2_saved_unit: "gCO2e",
    });
  });

  it("summarizes only existing impact records for the current user", async () => {
    await insertActiveEnvironmentPolicy();
    const firstRental = await createRentalForImpact();
    const secondRental = await createRentalForImpact({ duration: 10 });
    const otherUserRental = await createRentalForImpact({
      userId: OTHER_USER_ID,
      duration: 60,
    });

    for (const rentalId of [
      firstRental.id,
      secondRental.id,
      otherUserRental.id,
    ]) {
      const response = await fixture.app.request(
        `http://test/internal/environment/calculate-from-rental/${rentalId}`,
        {
          method: "POST",
          headers: adminHeaders(),
        },
      );
      expect(response.status).toBe(200);
    }

    const response = await fixture.app.request("http://test/environment/me/summary", {
      method: "GET",
      headers: userHeaders(),
    });
    const body = await response.json() as EnvironmentContracts.EnvironmentSummary;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      total_trips_counted: 2,
      total_estimated_distance_km: 5.4,
      total_co2_saved: 344,
      co2_saved_unit: "gCO2e",
    });
  });

  it("does not expose another user's environment summary", async () => {
    await insertActiveEnvironmentPolicy();
    const regularRental = await createRentalForImpact();
    const otherUserRental = await createRentalForImpact({
      userId: OTHER_USER_ID,
      duration: 60,
    });

    for (const rentalId of [regularRental.id, otherUserRental.id]) {
      const response = await fixture.app.request(
        `http://test/internal/environment/calculate-from-rental/${rentalId}`,
        {
          method: "POST",
          headers: adminHeaders(),
        },
      );
      expect(response.status).toBe(200);
    }

    const response = await fixture.app.request("http://test/environment/me/summary", {
      method: "GET",
      headers: otherUserHeaders(),
    });
    const body = await response.json() as EnvironmentContracts.EnvironmentSummary;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      total_trips_counted: 1,
      total_estimated_distance_km: 11.4,
      total_co2_saved: 727,
      co2_saved_unit: "gCO2e",
    });
  });

  it("rejects admin environment summary requests", async () => {
    const response = await fixture.app.request("http://test/environment/me/summary", {
      method: "GET",
      headers: adminHeaders(),
    });

    expect(response.status).toBe(403);
  });

  it("rejects unauthenticated environment summary requests", async () => {
    const response = await fixture.app.request("http://test/environment/me/summary", {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });

  it("returns an empty environment impact history when the current user has no impact records", async () => {
    const response = await fixture.app.request("http://test/environment/me/history", {
      method: "GET",
      headers: userHeaders(),
    });
    const body = await response.json() as EnvironmentContracts.EnvironmentImpactHistoryResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
    });
  });

  it("lists only calculated environment impact history for the current user", async () => {
    await insertActiveEnvironmentPolicy();
    const olderRental = await createRentalForImpact({ duration: 23 });
    const newerRental = await createRentalForImpact({ duration: 10 });
    const uncalculatedRental = await createRentalForImpact({ duration: 30 });
    const otherUserRental = await createRentalForImpact({
      userId: OTHER_USER_ID,
      duration: 60,
    });

    await calculateEnvironmentImpact(olderRental.id);
    await calculateEnvironmentImpact(newerRental.id);
    await calculateEnvironmentImpact(otherUserRental.id);

    await setImpactCalculatedAt(
      olderRental.id,
      new Date("2026-04-14T10:00:00.000Z"),
    );
    await setImpactCalculatedAt(
      newerRental.id,
      new Date("2026-04-15T10:00:00.000Z"),
    );
    await setImpactCalculatedAt(
      otherUserRental.id,
      new Date("2026-04-16T10:00:00.000Z"),
    );

    const response = await fixture.app.request("http://test/environment/me/history", {
      method: "GET",
      headers: userHeaders(),
    });
    const body = await response.json() as EnvironmentContracts.EnvironmentImpactHistoryResponse;

    expect(response.status).toBe(200);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(20);
    expect(body.totalItems).toBe(2);
    expect(body.totalPages).toBe(1);
    expect(body.items.map(item => item.rental_id)).toEqual([
      newerRental.id,
      olderRental.id,
    ]);
    expect(body.items.map(item => item.rental_id)).not.toContain(
      uncalculatedRental.id,
    );
    expect(body.items[0]).toMatchObject({
      rental_id: newerRental.id,
      estimated_distance_km: 1.4,
      co2_saved: 89,
      co2_saved_unit: "gCO2e",
      distance_source: "TIME_SPEED",
      raw_rental_minutes: 10,
      effective_ride_minutes: 7,
      calculated_at: "2026-04-15T10:00:00.000Z",
    });
    expect(body.items[1]).toMatchObject({
      rental_id: olderRental.id,
      estimated_distance_km: 4,
      co2_saved: 255,
      co2_saved_unit: "gCO2e",
      distance_source: "TIME_SPEED",
      raw_rental_minutes: 23,
      effective_ride_minutes: 20,
      calculated_at: "2026-04-14T10:00:00.000Z",
    });
  });

  it("returns detailed environment impact for a rental owned by the current user", async () => {
    await insertActiveEnvironmentPolicy();
    const rental = await createRentalForImpact({ duration: 23 });

    await calculateEnvironmentImpact(rental.id);

    const response = await fixture.app.request(
      `http://test/environment/me/rentals/${rental.id}`,
      {
        method: "GET",
        headers: userHeaders(),
      },
    );
    const body = await response.json() as EnvironmentContracts.EnvironmentImpactDetail;

    expect(response.status).toBe(200);
    expect(body).not.toHaveProperty("user_id");
    expect(body).toMatchObject({
      rental_id: rental.id,
      policy_id: "018fa200-0000-7000-8000-000000000101",
      estimated_distance_km: 4,
      co2_saved: 255,
      co2_saved_unit: "gCO2e",
      raw_rental_minutes: 23,
      effective_ride_minutes: 20,
      return_scan_buffer_minutes: 3,
      average_speed_kmh: 12,
      co2_saved_per_km: 75,
      co2_saved_per_km_unit: "gCO2e/km",
      confidence_factor: 0.85,
      distance_source: "TIME_SPEED",
      formula_version: "PHASE_1_TIME_SPEED",
      policy_snapshot: {
        policy_id: "018fa200-0000-7000-8000-000000000101",
        policy_name: "Default Environment Policy v1",
        average_speed_kmh: 12,
        co2_saved_per_km: 75,
        co2_saved_per_km_unit: "gCO2e/km",
        return_scan_buffer_minutes: 3,
        confidence_factor: 0.85,
        raw_rental_minutes: 23,
        effective_ride_minutes: 20,
        estimated_distance_km: 4,
        co2_saved: 255,
        co2_saved_unit: "gCO2e",
        distance_source: "TIME_SPEED",
        formula_version: "PHASE_1_TIME_SPEED",
      },
    });
  });

  it("returns 404 for environment impact detail when the rental has no impact record", async () => {
    const rental = await createRentalForImpact({ duration: 23 });

    const response = await fixture.app.request(
      `http://test/environment/me/rentals/${rental.id}`,
      {
        method: "GET",
        headers: userHeaders(),
      },
    );
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(404);
    expect(body.error).toBe("Environment impact not found");
    expect(body.details?.code).toBe("ENVIRONMENT_IMPACT_NOT_FOUND");
  });

  it("returns 404 for environment impact detail owned by another user", async () => {
    await insertActiveEnvironmentPolicy();
    const otherUserRental = await createRentalForImpact({
      userId: OTHER_USER_ID,
      duration: 23,
    });

    await calculateEnvironmentImpact(otherUserRental.id);

    const response = await fixture.app.request(
      `http://test/environment/me/rentals/${otherUserRental.id}`,
      {
        method: "GET",
        headers: userHeaders(),
      },
    );
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(404);
    expect(body.error).toBe("Environment impact not found");
    expect(body.details?.code).toBe("ENVIRONMENT_IMPACT_NOT_FOUND");
  });

  it("rejects invalid rentalId params for environment impact detail", async () => {
    const response = await fixture.app.request(
      "http://test/environment/me/rentals/not-a-uuid",
      {
        method: "GET",
        headers: userHeaders(),
      },
    );
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("VALIDATION_ERROR");
  });

  it("rejects admin environment impact detail requests", async () => {
    const response = await fixture.app.request(
      "http://test/environment/me/rentals/018fa200-0000-7000-8000-000000000601",
      {
        method: "GET",
        headers: adminHeaders(),
      },
    );

    expect(response.status).toBe(403);
  });

  it("rejects unauthenticated environment impact detail requests", async () => {
    const response = await fixture.app.request(
      "http://test/environment/me/rentals/018fa200-0000-7000-8000-000000000602",
      {
        method: "GET",
      },
    );

    expect(response.status).toBe(401);
  });

  it("paginates, sorts, and date-filters environment impact history with UTC date-only bounds", async () => {
    await insertActiveEnvironmentPolicy();
    const firstRental = await createRentalForImpact({ duration: 12 });
    const secondRental = await createRentalForImpact({ duration: 20 });
    const thirdRental = await createRentalForImpact({ duration: 28 });

    await calculateEnvironmentImpact(firstRental.id);
    await calculateEnvironmentImpact(secondRental.id);
    await calculateEnvironmentImpact(thirdRental.id);

    await setImpactCalculatedAt(
      firstRental.id,
      new Date("2026-04-13T10:00:00.000Z"),
    );
    await setImpactCalculatedAt(
      secondRental.id,
      new Date("2026-04-14T10:00:00.000Z"),
    );
    await setImpactCalculatedAt(
      thirdRental.id,
      new Date("2026-04-15T10:00:00.000Z"),
    );

    const response = await fixture.app.request(
      "http://test/environment/me/history?page=2&pageSize=1&sortOrder=asc&dateFrom=2026-04-14&dateTo=2026-04-15",
      {
        method: "GET",
        headers: userHeaders(),
      },
    );
    const body = await response.json() as EnvironmentContracts.EnvironmentImpactHistoryResponse;

    expect(response.status).toBe(200);
    expect(body.page).toBe(2);
    expect(body.pageSize).toBe(1);
    expect(body.totalItems).toBe(2);
    expect(body.totalPages).toBe(2);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.rental_id).toBe(thirdRental.id);
  });

  it("interprets environment impact history date-only filters as UTC day boundaries", async () => {
    await insertActiveEnvironmentPolicy();
    const beforeUtcDayRental = await createRentalForImpact({ duration: 12 });
    const startBoundaryRental = await createRentalForImpact({ duration: 20 });
    const endBoundaryRental = await createRentalForImpact({ duration: 28 });
    const afterUtcDayRental = await createRentalForImpact({ duration: 36 });

    await calculateEnvironmentImpact(beforeUtcDayRental.id);
    await calculateEnvironmentImpact(startBoundaryRental.id);
    await calculateEnvironmentImpact(endBoundaryRental.id);
    await calculateEnvironmentImpact(afterUtcDayRental.id);

    await setImpactCalculatedAt(
      beforeUtcDayRental.id,
      new Date("2026-04-14T23:59:59.999Z"),
    );
    await setImpactCalculatedAt(
      startBoundaryRental.id,
      new Date("2026-04-15T00:00:00.000Z"),
    );
    await setImpactCalculatedAt(
      endBoundaryRental.id,
      new Date("2026-04-15T23:59:59.999Z"),
    );
    await setImpactCalculatedAt(
      afterUtcDayRental.id,
      new Date("2026-04-16T00:00:00.000Z"),
    );

    const response = await fixture.app.request(
      "http://test/environment/me/history?sortOrder=asc&dateFrom=2026-04-15&dateTo=2026-04-15",
      {
        method: "GET",
        headers: userHeaders(),
      },
    );
    const body = await response.json() as EnvironmentContracts.EnvironmentImpactHistoryResponse;

    expect(response.status).toBe(200);
    expect(body.totalItems).toBe(2);
    expect(body.items.map(item => item.rental_id)).toEqual([
      startBoundaryRental.id,
      endBoundaryRental.id,
    ]);

    const mixedBoundaryResponse = await fixture.app.request(
      "http://test/environment/me/history?dateFrom=2026-04-15T23:59:59.999Z&dateTo=2026-04-15",
      {
        method: "GET",
        headers: userHeaders(),
      },
    );
    const mixedBoundaryBody = await mixedBoundaryResponse.json() as EnvironmentContracts.EnvironmentImpactHistoryResponse;

    expect(mixedBoundaryResponse.status).toBe(200);
    expect(mixedBoundaryBody.totalItems).toBe(1);
    expect(mixedBoundaryBody.items[0]?.rental_id).toBe(endBoundaryRental.id);
  });

  it("supports Vietnam local-day environment impact history filtering when clients send converted UTC datetimes", async () => {
    await insertActiveEnvironmentPolicy();
    const beforeVietnamDayRental = await createRentalForImpact({ duration: 12 });
    const vietnamDayStartRental = await createRentalForImpact({ duration: 20 });
    const vietnamDayEndRental = await createRentalForImpact({ duration: 28 });
    const afterVietnamDayRental = await createRentalForImpact({ duration: 36 });

    await calculateEnvironmentImpact(beforeVietnamDayRental.id);
    await calculateEnvironmentImpact(vietnamDayStartRental.id);
    await calculateEnvironmentImpact(vietnamDayEndRental.id);
    await calculateEnvironmentImpact(afterVietnamDayRental.id);

    await setImpactCalculatedAt(
      beforeVietnamDayRental.id,
      new Date("2026-04-14T16:59:59.999Z"),
    );
    await setImpactCalculatedAt(
      vietnamDayStartRental.id,
      new Date("2026-04-14T17:00:00.000Z"),
    );
    await setImpactCalculatedAt(
      vietnamDayEndRental.id,
      new Date("2026-04-15T16:59:59.999Z"),
    );
    await setImpactCalculatedAt(
      afterVietnamDayRental.id,
      new Date("2026-04-15T17:00:00.000Z"),
    );

    const response = await fixture.app.request(
      "http://test/environment/me/history?sortOrder=asc&dateFrom=2026-04-14T17:00:00.000Z&dateTo=2026-04-15T16:59:59.999Z",
      {
        method: "GET",
        headers: userHeaders(),
      },
    );
    const body = await response.json() as EnvironmentContracts.EnvironmentImpactHistoryResponse;

    expect(response.status).toBe(200);
    expect(body.totalItems).toBe(2);
    expect(body.items.map(item => item.rental_id)).toEqual([
      vietnamDayStartRental.id,
      vietnamDayEndRental.id,
    ]);
  });

  it("uses timezone-offset environment impact history datetimes as exact instants", async () => {
    await insertActiveEnvironmentPolicy();
    const beforeInstantRental = await createRentalForImpact({ duration: 12 });
    const exactInstantRental = await createRentalForImpact({ duration: 20 });

    await calculateEnvironmentImpact(beforeInstantRental.id);
    await calculateEnvironmentImpact(exactInstantRental.id);

    await setImpactCalculatedAt(
      beforeInstantRental.id,
      new Date("2026-04-14T16:59:59.999Z"),
    );
    await setImpactCalculatedAt(
      exactInstantRental.id,
      new Date("2026-04-14T17:00:00.000Z"),
    );

    const response = await fixture.app.request(
      "http://test/environment/me/history?dateFrom=2026-04-15T00:00:00.000%2B07:00&dateTo=2026-04-15T00:00:00.000%2B07:00",
      {
        method: "GET",
        headers: userHeaders(),
      },
    );
    const body = await response.json() as EnvironmentContracts.EnvironmentImpactHistoryResponse;

    expect(response.status).toBe(200);
    expect(body.totalItems).toBe(1);
    expect(body.items.map(item => item.rental_id)).toEqual([
      exactInstantRental.id,
    ]);
  });

  it("does not expose another user's environment impact history", async () => {
    await insertActiveEnvironmentPolicy();
    const regularRental = await createRentalForImpact({ duration: 23 });
    const otherUserRental = await createRentalForImpact({
      userId: OTHER_USER_ID,
      duration: 60,
    });

    await calculateEnvironmentImpact(regularRental.id);
    await calculateEnvironmentImpact(otherUserRental.id);

    const response = await fixture.app.request("http://test/environment/me/history", {
      method: "GET",
      headers: otherUserHeaders(),
    });
    const body = await response.json() as EnvironmentContracts.EnvironmentImpactHistoryResponse;

    expect(response.status).toBe(200);
    expect(body.totalItems).toBe(1);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.rental_id).toBe(otherUserRental.id);
  });

  it("rejects invalid environment impact history query params", async () => {
    const invalidQueries = [
      "page=0",
      "pageSize=0",
      "pageSize=101",
      "sortOrder=up",
      "dateFrom=not-a-date",
      "dateTo=not-a-date",
      "dateFrom=2026-04-16T00:00:00.000Z&dateTo=2026-04-15T00:00:00.000Z",
    ];

    for (const query of invalidQueries) {
      const response = await fixture.app.request(
        `http://test/environment/me/history?${query}`,
        {
          method: "GET",
          headers: userHeaders(),
        },
      );
      const body = await response.json() as ServerErrorResponse;

      expect(response.status).toBe(400);
      expect(body.details?.code).toBe("VALIDATION_ERROR");
    }
  });

  it("rejects admin environment impact history requests", async () => {
    const response = await fixture.app.request("http://test/environment/me/history", {
      method: "GET",
      headers: adminHeaders(),
    });

    expect(response.status).toBe(403);
  });

  it("rejects unauthenticated environment impact history requests", async () => {
    const response = await fixture.app.request("http://test/environment/me/history", {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });

  it("keeps environment impact calculation idempotent by rentalId", async () => {
    await insertActiveEnvironmentPolicy();
    const rental = await createRentalForImpact();

    const firstResponse = await fixture.app.request(
      `http://test/internal/environment/calculate-from-rental/${rental.id}`,
      {
        method: "POST",
        headers: adminHeaders(),
      },
    );
    const firstBody = await firstResponse.json() as EnvironmentContracts.EnvironmentImpact;

    const secondResponse = await fixture.app.request(
      `http://test/internal/environment/calculate-from-rental/${rental.id}`,
      {
        method: "POST",
        headers: adminHeaders(),
      },
    );
    const secondBody = await secondResponse.json() as EnvironmentContracts.EnvironmentImpact;

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(firstBody.already_calculated).toBe(false);
    expect(secondBody.already_calculated).toBe(true);
    expect(secondBody.id).toBe(firstBody.id);

    const [dbImpact] = await fixture.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count
      FROM "public"."environmental_impact_stats"
      WHERE "rental_id" = ${rental.id}::uuid
    `;

    expect(Number(dbImpact?.count ?? 0)).toBe(1);
  });

  it("returns 404 when calculating impact for a missing rental", async () => {
    await insertActiveEnvironmentPolicy();

    const response = await fixture.app.request(
      "http://test/internal/environment/calculate-from-rental/018fa200-0000-7000-8000-000000000404",
      {
        method: "POST",
        headers: adminHeaders(),
      },
    );
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(404);
    expect(body.error).toBe("Rental not found");
    expect(body.details?.code).toBe("ENVIRONMENT_IMPACT_RENTAL_NOT_FOUND");
  });

  it("returns 409 when calculating impact for a non-completed rental", async () => {
    await insertActiveEnvironmentPolicy();
    const rental = await createRentalForImpact({
      status: "RENTED",
      endTime: null,
      duration: null,
    });

    const response = await fixture.app.request(
      `http://test/internal/environment/calculate-from-rental/${rental.id}`,
      {
        method: "POST",
        headers: adminHeaders(),
      },
    );
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(409);
    expect(body.error).toBe("Rental must be completed before calculating environment impact");
    expect(body.details?.code).toBe("ENVIRONMENT_IMPACT_RENTAL_NOT_COMPLETED");
  });

  it("returns 404 when calculating impact without an active environment policy", async () => {
    const rental = await createRentalForImpact();

    const response = await fixture.app.request(
      `http://test/internal/environment/calculate-from-rental/${rental.id}`,
      {
        method: "POST",
        headers: adminHeaders(),
      },
    );
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(404);
    expect(body.error).toBe("No active environment policy found");
    expect(body.details?.code).toBe("ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND");
  });

  it("stores zero impact for abnormal non-positive rental duration", async () => {
    await insertActiveEnvironmentPolicy();
    const rental = await createRentalForImpact({ duration: 0 });

    const response = await fixture.app.request(
      `http://test/internal/environment/calculate-from-rental/${rental.id}`,
      {
        method: "POST",
        headers: adminHeaders(),
      },
    );
    const body = await response.json() as EnvironmentContracts.EnvironmentImpact;

    expect(response.status).toBe(200);
    expect(body.estimated_distance_km).toBe(0);
    expect(body.co2_saved).toBe(0);
    expect(body.policy_snapshot.raw_rental_minutes).toBe(0);
    expect(body.policy_snapshot.effective_ride_minutes).toBe(0);
  });

  it("rejects invalid rentalId params for environment impact calculation", async () => {
    const response = await fixture.app.request(
      "http://test/internal/environment/calculate-from-rental/not-a-uuid",
      {
        method: "POST",
        headers: adminHeaders(),
      },
    );
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("VALIDATION_ERROR");
  });

  it("rejects unauthenticated environment impact calculation requests", async () => {
    const response = await fixture.app.request(
      "http://test/internal/environment/calculate-from-rental/018fa200-0000-7000-8000-000000000501",
      {
        method: "POST",
      },
    );

    expect(response.status).toBe(401);
  });

  it("rejects non-admin environment impact calculation requests", async () => {
    const response = await fixture.app.request(
      "http://test/internal/environment/calculate-from-rental/018fa200-0000-7000-8000-000000000502",
      {
        method: "POST",
        headers: userHeaders(),
      },
    );

    expect(response.status).toBe(403);
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

  it("activates an inactive environment policy and deactivates the previous active policy", async () => {
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000041",
      name: "Previous Active Environment Policy",
      status: "ACTIVE",
      activeFrom: new Date("2026-04-15T00:00:00.000Z"),
      activeTo: null,
      updatedAt: new Date("2026-04-15T01:00:00.000Z"),
      formulaConfig: {
        return_scan_buffer_minutes: 5,
        confidence_factor: 0.9,
      },
    });
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000042",
      name: "Target Inactive Environment Policy",
      status: "INACTIVE",
      activeFrom: null,
      activeTo: null,
      updatedAt: new Date("2026-04-15T02:00:00.000Z"),
      formulaConfig: {},
    });

    const response = await fixture.app.request(
      "http://test/environment/policies/018fa200-0000-7000-8000-000000000042/activate",
      {
        method: "PATCH",
        headers: adminHeaders(),
      },
    );
    const body = await response.json() as EnvironmentContracts.EnvironmentPolicy;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: "018fa200-0000-7000-8000-000000000042",
      name: "Target Inactive Environment Policy",
      status: "ACTIVE",
      active_to: null,
      co2_saved_per_km_unit: "gCO2e/km",
      formula_config: {
        return_scan_buffer_minutes: 3,
        confidence_factor: 0.85,
        display_unit: "gCO2e",
        formula_version: "PHASE_1_TIME_SPEED",
        distance_source: "TIME_SPEED",
      },
    });
    expect(body.active_from).not.toBeNull();

    const rows = await fixture.prisma.$queryRaw<
      Array<{ id: string; status: string; active_from: Date | null; active_to: Date | null }>
    >`
      SELECT "id", "status", "active_from", "active_to"
      FROM "public"."environmental_impact_policies"
      WHERE "id" IN (
        '018fa200-0000-7000-8000-000000000041'::uuid,
        '018fa200-0000-7000-8000-000000000042'::uuid
      )
      ORDER BY "id"
    `;

    expect(rows).toMatchObject([
      {
        id: "018fa200-0000-7000-8000-000000000041",
        status: "INACTIVE",
      },
      {
        id: "018fa200-0000-7000-8000-000000000042",
        status: "ACTIVE",
        active_to: null,
      },
    ]);

    const [activeCount] = await fixture.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count
      FROM "public"."environmental_impact_policies"
      WHERE "status" = 'ACTIVE'::"AccountStatus"
    `;

    expect(Number(activeCount?.count ?? 0)).toBe(1);
  });

  it("keeps activate idempotent when the target is already active and cleans up other active rows", async () => {
    const targetActiveFrom = new Date("2026-04-15T03:00:00.000Z");
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000043",
      name: "Already Active Environment Policy",
      status: "ACTIVE",
      activeFrom: targetActiveFrom,
      activeTo: null,
      updatedAt: new Date("2026-04-15T03:01:00.000Z"),
      formulaConfig: {},
    });
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000044",
      name: "Legacy Other Active Environment Policy",
      status: "ACTIVE",
      activeFrom: new Date("2026-04-15T02:00:00.000Z"),
      activeTo: null,
      updatedAt: new Date("2026-04-15T02:01:00.000Z"),
      formulaConfig: {},
    });

    const response = await fixture.app.request(
      "http://test/environment/policies/018fa200-0000-7000-8000-000000000043/activate",
      {
        method: "PATCH",
        headers: adminHeaders(),
      },
    );
    const body = await response.json() as EnvironmentContracts.EnvironmentPolicy;

    expect(response.status).toBe(200);
    expect(body.id).toBe("018fa200-0000-7000-8000-000000000043");
    expect(body.status).toBe("ACTIVE");
    expect(body.active_from).toBe(targetActiveFrom.toISOString());

    const [other] = await fixture.prisma.$queryRaw<Array<{ status: string }>>`
      SELECT "status"
      FROM "public"."environmental_impact_policies"
      WHERE "id" = '018fa200-0000-7000-8000-000000000044'::uuid
    `;

    expect(other?.status).toBe("INACTIVE");
  });

  it("rejects invalid activate policyId params", async () => {
    const response = await fixture.app.request(
      "http://test/environment/policies/not-a-uuid/activate",
      {
        method: "PATCH",
        headers: adminHeaders(),
      },
    );
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when activating a missing environment policy", async () => {
    const response = await fixture.app.request(
      "http://test/environment/policies/018fa200-0000-7000-8000-000000000045/activate",
      {
        method: "PATCH",
        headers: adminHeaders(),
      },
    );
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(404);
    expect(body.error).toBe("Environment policy not found");
    expect(body.details?.code).toBe("ENVIRONMENT_POLICY_NOT_FOUND");
  });

  it("blocks activating suspended or banned environment policies", async () => {
    await insertEnvironmentPolicy({
      id: "018fa200-0000-7000-8000-000000000046",
      name: "Suspended Environment Policy",
      status: "SUSPENDED",
      activeFrom: null,
      activeTo: null,
      updatedAt: new Date("2026-04-15T04:00:00.000Z"),
      formulaConfig: {},
    });

    const response = await fixture.app.request(
      "http://test/environment/policies/018fa200-0000-7000-8000-000000000046/activate",
      {
        method: "PATCH",
        headers: adminHeaders(),
      },
    );
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(409);
    expect(body.error).toBe("Cannot activate suspended or banned environment policy");
    expect(body.details?.code).toBe("ENVIRONMENT_POLICY_ACTIVATION_BLOCKED");
  });

  it("rejects unauthenticated activate requests", async () => {
    const response = await fixture.app.request(
      "http://test/environment/policies/018fa200-0000-7000-8000-000000000047/activate",
      {
        method: "PATCH",
      },
    );

    expect(response.status).toBe(401);
  });

  it("rejects non-admin activate requests", async () => {
    const response = await fixture.app.request(
      "http://test/environment/policies/018fa200-0000-7000-8000-000000000048/activate",
      {
        method: "PATCH",
        headers: userHeaders(),
      },
    );

    expect(response.status).toBe(403);
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
