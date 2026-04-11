import type { AgenciesContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22320";
const STAFF_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22321";

describe("admin agency stats routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const {
        AgencyDepsLive,
        UserDepsLive,
      } = await import("@/http/shared/providers");

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
            fullName: "Agency Stats Admin",
            email: "agency-stats-admin@example.com",
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
            fullName: "Agency Stats Staff",
            email: "agency-stats-staff@example.com",
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
      Authorization: `Bearer ${token}`,
    };
  }

  it("returns agency operational statistics for admin", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        name: "Agency Stats One",
        contactPhone: "0901234567",
        status: "ACTIVE",
      },
    });

    const station = await fixture.factories.station({
      name: "Agency Station One",
      stationType: "AGENCY",
      agencyId: agency.id,
      capacity: 12,
      pickupSlotLimit: 8,
      returnSlotLimit: 9,
    });

    await fixture.factories.bike({
      stationId: station.id,
      status: "AVAILABLE",
    });
    const bookedBike = await fixture.factories.bike({
      stationId: station.id,
      status: "BOOKED",
    });
    const brokenBike = await fixture.factories.bike({
      stationId: station.id,
      status: "BROKEN",
    });
    await fixture.factories.bike({
      stationId: station.id,
      status: "RESERVED",
    });

    const activeOperator = await fixture.factories.user({
      fullname: "Active Agency Operator",
      email: "active-operator@example.com",
      role: "AGENCY",
      accountStatus: "ACTIVE",
    });
    const suspendedOperator = await fixture.factories.user({
      fullname: "Suspended Agency Operator",
      email: "suspended-operator@example.com",
      role: "AGENCY",
      accountStatus: "SUSPENDED",
    });

    await fixture.factories.userOrgAssignment({
      userId: activeOperator.id,
      agencyId: agency.id,
    });
    await fixture.factories.userOrgAssignment({
      userId: suspendedOperator.id,
      agencyId: agency.id,
    });

    const customer = await fixture.factories.user({
      fullname: "Agency Stats Customer",
      email: "agency-stats-customer@example.com",
      role: "USER",
    });

    const from = new Date("2026-03-01T00:00:00.000Z");
    const to = new Date("2026-03-31T23:59:59.999Z");

    const completedRental = await fixture.factories.rental({
      userId: customer.id,
      bikeId: bookedBike.id,
      startStationId: station.id,
      endStationId: station.id,
      startTime: new Date("2026-03-10T08:00:00.000Z"),
      endTime: new Date("2026-03-10T08:45:00.000Z"),
      duration: 45,
      totalPrice: "32000",
      status: "COMPLETED",
    });

    await fixture.factories.rental({
      userId: customer.id,
      bikeId: brokenBike.id,
      startStationId: station.id,
      startTime: new Date("2026-03-12T09:00:00.000Z"),
      duration: 15,
      status: "RENTED",
    });

    await fixture.factories.rental({
      userId: customer.id,
      bikeId: bookedBike.id,
      startStationId: station.id,
      startTime: new Date("2026-03-14T10:00:00.000Z"),
      endTime: null,
      duration: null,
      totalPrice: null,
      status: "CANCELLED",
    });

    await fixture.prisma.returnConfirmation.create({
      data: {
        rentalId: completedRental.id,
        stationId: station.id,
        confirmedByUserId: activeOperator.id,
        confirmationMethod: "MANUAL",
        handoverStatus: "UNDER_AGENCY_CARE",
        confirmedAt: new Date("2026-03-10T08:50:00.000Z"),
      },
    });

    await fixture.prisma.incidentReport.createMany({
      data: [
        {
          reporterUserId: customer.id,
          rentalId: completedRental.id,
          bikeId: bookedBike.id,
          stationId: station.id,
          source: "STAFF_INSPECTION",
          incidentType: "BRAKE",
          severity: "CRITICAL",
          description: "Brake issue",
          bikeLocked: true,
          status: "OPEN",
          reportedAt: new Date("2026-03-15T08:00:00.000Z"),
        },
        {
          reporterUserId: customer.id,
          bikeId: brokenBike.id,
          stationId: station.id,
          source: "POST_RETURN",
          incidentType: "CHAIN",
          severity: "MEDIUM",
          description: "Chain adjusted",
          bikeLocked: false,
          status: "RESOLVED",
          reportedAt: new Date("2026-03-16T08:00:00.000Z"),
          resolvedAt: new Date("2026-03-16T09:00:00.000Z"),
        },
      ],
    });

    const response = await fixture.app.request(
      `http://test/v1/admin/agencies/${agency.id}/stats?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const body = await response.json() as AgenciesContracts.AgencyOperationalStatsResponse;

    expect(response.status).toBe(200);
    expect(body.agency.id).toBe(agency.id);
    expect(body.agency.station?.id).toBe(station.id);
    expect(body.period.from).toBe(from.toISOString());
    expect(body.period.to).toBe(to.toISOString());
    expect(body.operators).toEqual({
      totalOperators: 2,
      activeOperators: 1,
    });
    expect(body.currentStation).toMatchObject({
      totalCapacity: 12,
      pickupSlotLimit: 8,
      returnSlotLimit: 9,
      totalBikes: 4,
      availableBikes: 1,
      bookedBikes: 1,
      brokenBikes: 1,
      reservedBikes: 1,
      maintainedBikes: 0,
      unavailableBikes: 0,
      emptySlots: 8,
    });
    expect(body.currentStation.occupancyRate).toBeCloseTo(33.33, 2);
    expect(body.pickups).toEqual({
      totalRentals: 3,
      activeRentals: 1,
      completedRentals: 1,
      cancelledRentals: 1,
      totalRevenue: 32000,
      avgDurationMinutes: 45,
    });
    expect(body.returns).toEqual({
      totalReturns: 1,
      agencyConfirmedReturns: 1,
    });
    expect(body.incidents).toEqual({
      totalIncidentsInPeriod: 2,
      openIncidents: 1,
      resolvedIncidentsInPeriod: 1,
      criticalOpenIncidents: 1,
    });
  });

  it("returns validation error when only one bound is provided", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        name: "Agency Validation",
        contactPhone: null,
        status: "ACTIVE",
      },
    });

    const response = await fixture.app.request(
      `http://test/v1/admin/agencies/${agency.id}/stats?from=${encodeURIComponent("2026-03-01T00:00:00.000Z")}`,
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const body = await response.json() as {
      error: string;
      details: { code: string; issues?: Array<{ path: string; message: string }> };
    };

    expect(response.status).toBe(400);
    expect(body.details.code).toBe("VALIDATION_ERROR");
    expect(body.details.issues?.some(issue =>
      issue.path.includes("to")
      && issue.message === "from and to must be provided together")).toBe(true);
  });

  it("returns 404 when the agency does not exist", async () => {
    const response = await fixture.app.request(
      "http://test/v1/admin/agencies/019b17bd-d130-7e7d-be69-91ceef7b9fff/stats",
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const body = await response.json() as AgenciesContracts.AgencyErrorResponse;

    expect(response.status).toBe(404);
    expect(body.details.code).toBe("AGENCY_NOT_FOUND");
  });

  it("rejects non-admin access", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        name: "Agency Forbidden",
        contactPhone: null,
        status: "ACTIVE",
      },
    });

    const response = await fixture.app.request(
      `http://test/v1/admin/agencies/${agency.id}/stats`,
      {
        method: "GET",
        headers: authHeader(STAFF_USER_ID, "STAFF"),
      },
    );

    expect(response.status).toBe(403);
  });
});
