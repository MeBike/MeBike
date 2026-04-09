import type { StationsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22310";

describe("admin stations routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { AgencyRepositoryLive } = await import("@/domain/agencies/repository/agency.repository");
      const { ReservationQueryRepositoryLive } = await import("@/domain/reservations/repository/reservation-query.repository");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { StationRepositoryLive } = await import("@/domain/stations/repository/station.repository");
      const { StationServiceLive } = await import("@/domain/stations/services/station.service");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      const agencyRepoLayer = AgencyRepositoryLive.pipe(Layer.provide(PrismaLive));
      const reservationQueryRepoLayer = ReservationQueryRepositoryLive.pipe(Layer.provide(PrismaLive));
      const stationRepoLayer = StationRepositoryLive.pipe(Layer.provide(PrismaLive));
      const stationServiceLayer = StationServiceLive.pipe(
        Layer.provide(Layer.mergeAll(stationRepoLayer, agencyRepoLayer, reservationQueryRepoLayer)),
      );

      return Layer.mergeAll(
        UserDepsLive,
        agencyRepoLayer,
        reservationQueryRepoLayer,
        stationRepoLayer,
        stationServiceLayer,
        PrismaLive,
      );
    },
    seedData: async (_db, prisma) => {
      await prisma.user.create({
        data: {
          id: ADMIN_USER_ID,
          fullName: "Route Admin",
          email: "route-admin-stations@example.com",
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

  it("returns only stations without assigned staff", async () => {
    const visibleStation = await fixture.factories.station({ name: "Visible Station" });
    const hiddenStation = await fixture.factories.station({ name: "Hidden Staff Station" });
    const technicianStation = await fixture.factories.station({ name: "Technician Station" });

    const staff = await fixture.factories.user({
      fullname: "Station Staff",
      email: "station-staff@example.com",
      role: "STAFF",
    });
    const technician = await fixture.factories.user({
      fullname: "Station Technician",
      email: "station-technician@example.com",
      role: "TECHNICIAN",
    });

    await fixture.factories.userOrgAssignment({
      userId: staff.id,
      stationId: hiddenStation.id,
    });
    await fixture.factories.userOrgAssignment({
      userId: technician.id,
      stationId: technicianStation.id,
    });

    const response = await fixture.app.request("http://test/v1/admin/stations?page=1&pageSize=20", {
      method: "GET",
      headers: adminAuthHeader(),
    });
    const body = await response.json() as StationsContracts.StationListResponse;

    expect(response.status).toBe(200);
    expect(body.data.map(station => station.id)).toContain(visibleStation.id);
    expect(body.data.map(station => station.id)).toContain(technicianStation.id);
    expect(body.data.map(station => station.id)).not.toContain(hiddenStation.id);
  });

  it("rejects lowering capacity below current bikes and active return slots", async () => {
    const station = await fixture.factories.station({
      capacity: 6,
      returnSlotLimit: 6,
    });
    await fixture.factories.bike({ stationId: station.id });
    await fixture.factories.bike({ stationId: station.id });

    const rider = await fixture.factories.user({
      fullname: "Return Rider",
      email: "return-rider@example.com",
      role: "USER",
    });
    const startStation = await fixture.factories.station({ name: "Origin Station" });
    const rentedBike = await fixture.factories.bike({ stationId: null });
    const rental = await fixture.factories.rental({
      userId: rider.id,
      bikeId: rentedBike.id,
      startStationId: startStation.id,
    });

    await fixture.prisma.returnSlotReservation.create({
      data: {
        rentalId: rental.id,
        userId: rider.id,
        stationId: station.id,
        reservedFrom: new Date(),
        status: "ACTIVE",
      },
    });

    const response = await fixture.app.request(`http://test/v1/stations/${station.id}`, {
      method: "PATCH",
      headers: adminAuthHeader(),
      body: JSON.stringify({ totalCapacity: 2 }),
    });
    const body = await response.json() as StationsContracts.StationErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("CAPACITY_BELOW_ACTIVE_USAGE");
    expect(body.details?.totalCapacity).toBe(2);
    expect(body.details?.totalBikes).toBe(2);
    expect(body.details?.activeReturnSlots).toBe(1);
  });

  it("rejects lowering return slot limit below active return slots", async () => {
    const station = await fixture.factories.station({
      capacity: 6,
      returnSlotLimit: 2,
    });

    const rider = await fixture.factories.user({
      fullname: "Return Slot Rider",
      email: "return-slot-rider@example.com",
      role: "USER",
    });
    const startStation = await fixture.factories.station({ name: "Return Slot Origin" });
    const rentedBike = await fixture.factories.bike({ stationId: null });
    const rental = await fixture.factories.rental({
      userId: rider.id,
      bikeId: rentedBike.id,
      startStationId: startStation.id,
    });

    await fixture.prisma.returnSlotReservation.create({
      data: {
        rentalId: rental.id,
        userId: rider.id,
        stationId: station.id,
        reservedFrom: new Date(),
        status: "ACTIVE",
      },
    });

    const response = await fixture.app.request(`http://test/v1/stations/${station.id}`, {
      method: "PATCH",
      headers: adminAuthHeader(),
      body: JSON.stringify({ returnSlotLimit: 0 }),
    });
    const body = await response.json() as StationsContracts.StationErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("RETURN_SLOT_LIMIT_BELOW_ACTIVE_RESERVATIONS");
    expect(body.details?.returnSlotLimit).toBe(0);
    expect(body.details?.activeReturnSlots).toBe(1);
  });

  it("rejects lowering pickup slot limit below pending reservations", async () => {
    const station = await fixture.factories.station({
      capacity: 6,
      pickupSlotLimit: 2,
    });
    const reserver = await fixture.factories.user({
      fullname: "Reservation User",
      email: "reservation-user@example.com",
      role: "USER",
    });

    await fixture.factories.reservation({
      userId: reserver.id,
      stationId: station.id,
      status: "PENDING",
    });

    const response = await fixture.app.request(`http://test/v1/stations/${station.id}`, {
      method: "PATCH",
      headers: adminAuthHeader(),
      body: JSON.stringify({ pickupSlotLimit: 0 }),
    });
    const body = await response.json() as StationsContracts.StationErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("PICKUP_SLOT_LIMIT_BELOW_PENDING_RESERVATIONS");
    expect(body.details?.pickupSlotLimit).toBe(0);
    expect(body.details?.pendingReservations).toBe(1);
  });
});
