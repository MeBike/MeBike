import type { StationsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22310";

describe("admin stations routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { AgencyRepositoryLive } = await import("@/domain/agencies/repository/agency.repository");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const {
        StationCommandRepositoryLive,
        StationCommandServiceLive,
        StationQueryRepositoryLive,
        StationQueryServiceLive,
      } = await import("@/domain/stations");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      const agencyRepoLayer = AgencyRepositoryLive.pipe(Layer.provide(PrismaLive));
      const stationQueryRepoLayer = StationQueryRepositoryLive.pipe(Layer.provide(PrismaLive));
      const stationCommandRepoLayer = StationCommandRepositoryLive.pipe(Layer.provide(PrismaLive));
      const stationQueryServiceLayer = StationQueryServiceLive.pipe(
        Layer.provide(stationQueryRepoLayer),
      );
      const stationCommandServiceLayer = StationCommandServiceLive.pipe(
        Layer.provide(Layer.mergeAll(stationCommandRepoLayer, stationQueryRepoLayer, agencyRepoLayer)),
      );

      return Layer.mergeAll(
        UserDepsLive,
        agencyRepoLayer,
        stationQueryRepoLayer,
        stationQueryServiceLayer,
        stationCommandRepoLayer,
        stationCommandServiceLayer,
        PrismaLive,
      );
    },
    seedData: async (_db, prisma) => {
      const { upsertVietnamBoundary } = await import("../../../../prisma/seed-geo-boundary");
      await upsertVietnamBoundary(prisma);

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
    const visibleStation = await fixture.factories.station({
      name: "Visible Station",
      address: "10 Visible Street, Thu Duc, TP.HCM",
      latitude: 10.7601,
      longitude: 106.6601,
    });
    const hiddenStation = await fixture.factories.station({
      name: "Hidden Staff Station",
      address: "20 Hidden Street, Thu Duc, TP.HCM",
      latitude: 10.7602,
      longitude: 106.6602,
    });
    const technicianStation = await fixture.factories.station({
      name: "Technician Station",
      address: "30 Technician Street, Thu Duc, TP.HCM",
      latitude: 10.7603,
      longitude: 106.6603,
    });

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

  it("includes staff, manager, and technicians in station detail workers", async () => {
    const station = await fixture.factories.station({
      name: "Worker Station",
      address: "11 Worker Street, Thu Duc, TP.HCM",
      latitude: 10.7604,
      longitude: 106.6604,
    });
    const staff = await fixture.factories.user({
      fullname: "Staff Worker",
      email: "worker-staff@example.com",
      role: "STAFF",
    });
    const manager = await fixture.factories.user({
      fullname: "Manager Worker",
      email: "worker-manager@example.com",
      role: "MANAGER",
    });
    const technician = await fixture.factories.user({
      fullname: "Technician Worker",
      email: "worker-technician@example.com",
      role: "TECHNICIAN",
    });
    const technicianTeam = await fixture.factories.technicianTeam({
      name: "Worker Team",
      stationId: station.id,
    });

    await fixture.factories.userOrgAssignment({
      userId: staff.id,
      stationId: station.id,
    });
    await fixture.factories.userOrgAssignment({
      userId: manager.id,
      stationId: station.id,
    });
    await fixture.factories.userOrgAssignment({
      userId: technician.id,
      technicianTeamId: technicianTeam.id,
    });

    const response = await fixture.app.request(`http://test/v1/stations/${station.id}`);
    const body = await response.json() as StationsContracts.StationReadSummary;

    expect(response.status).toBe(200);
    expect(body.workers).toEqual([
      {
        userId: manager.id,
        fullName: "Manager Worker",
        role: "MANAGER",
        technicianTeamId: null,
        technicianTeamName: null,
      },
      {
        userId: staff.id,
        fullName: "Staff Worker",
        role: "STAFF",
        technicianTeamId: null,
        technicianTeamName: null,
      },
      {
        userId: technician.id,
        fullName: "Technician Worker",
        role: "TECHNICIAN",
        technicianTeamId: technicianTeam.id,
        technicianTeamName: "Worker Team",
      },
    ]);
  });

  it("rejects creating a station with duplicate exact location", async () => {
    await fixture.factories.station({
      name: "Existing Exact Location",
      address: "371 Duong Doan Ket, Binh Tho, Thu Duc, TP.HCM",
      latitude: 10.762622,
      longitude: 106.660172,
    });

    const response = await fixture.app.request("http://test/v1/stations", {
      method: "POST",
      headers: adminAuthHeader(),
      body: JSON.stringify({
        name: "New Station Same Spot",
        address: "371 Duong Doan Ket, Binh Tho, Thu Duc, TP.HCM",
        totalCapacity: 20,
        latitude: 10.762622,
        longitude: 106.660172,
      }),
    });
    const body = await response.json() as StationsContracts.StationErrorResponse;

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Station address and coordinates already exist",
      details: {
        code: "STATION_LOCATION_ALREADY_EXISTS",
        address: "371 Duong Doan Ket, Binh Tho, Thu Duc, TP.HCM",
        latitude: 10.762622,
        longitude: 106.660172,
      },
    });
  });

  it("rejects updating a station to duplicate exact location", async () => {
    await fixture.factories.station({
      name: "Target Exact Location",
      address: "500 Xa Lo Ha Noi, Thu Duc, TP.HCM",
      latitude: 10.8486,
      longitude: 106.7717,
    });
    const source = await fixture.factories.station({
      name: "Source Exact Location",
      address: "12 Le Loi, Ben Nghe, District 1, TP.HCM",
      latitude: 10.775,
      longitude: 106.699,
    });

    const response = await fixture.app.request(`http://test/v1/stations/${source.id}`, {
      method: "PATCH",
      headers: adminAuthHeader(),
      body: JSON.stringify({
        address: "500 Xa Lo Ha Noi, Thu Duc, TP.HCM",
        latitude: 10.8486,
        longitude: 106.7717,
      }),
    });
    const body = await response.json() as StationsContracts.StationErrorResponse;

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Station address and coordinates already exist",
      details: {
        code: "STATION_LOCATION_ALREADY_EXISTS",
        address: "500 Xa Lo Ha Noi, Thu Duc, TP.HCM",
        latitude: 10.8486,
        longitude: 106.7717,
      },
    });
  });

  it("rejects lowering capacity below current bikes and active return slots", async () => {
    const station = await fixture.factories.station({
      address: "40 Capacity Street, Thu Duc, TP.HCM",
      capacity: 6,
      returnSlotLimit: 6,
      latitude: 10.761,
      longitude: 106.661,
    });
    await fixture.factories.bike({ stationId: station.id });
    await fixture.factories.bike({ stationId: station.id });

    const rider = await fixture.factories.user({
      fullname: "Return Rider",
      email: "return-rider@example.com",
      role: "USER",
    });
    const startStation = await fixture.factories.station({
      name: "Origin Station",
      address: "50 Origin Street, Thu Duc, TP.HCM",
      latitude: 10.762,
      longitude: 106.662,
    });
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
      address: "60 Return Slot Street, Thu Duc, TP.HCM",
      capacity: 6,
      returnSlotLimit: 2,
      latitude: 10.763,
      longitude: 106.663,
    });

    const rider = await fixture.factories.user({
      fullname: "Return Slot Rider",
      email: "return-slot-rider@example.com",
      role: "USER",
    });
    const startStation = await fixture.factories.station({
      name: "Return Slot Origin",
      address: "70 Return Slot Origin Street, Thu Duc, TP.HCM",
      latitude: 10.764,
      longitude: 106.664,
    });
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
});
