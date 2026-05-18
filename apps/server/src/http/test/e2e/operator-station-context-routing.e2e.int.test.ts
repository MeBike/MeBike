import type { OperatorsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("operator station context routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const {
        StationDepsLive,
        UserDepsLive,
      } = await import("@/http/shared/providers");

      return Layer.mergeAll(
        StationDepsLive,
        UserDepsLive,
      );
    },
  });

  async function createStaffToken(stationId?: string) {
    const staff = await fixture.factories.user({ role: "STAFF" });

    if (stationId) {
      await fixture.factories.userOrgAssignment({ userId: staff.id, stationId });
    }

    return fixture.auth.makeAccessToken({ userId: staff.id, role: "STAFF" });
  }

  async function createManagerToken(stationId?: string) {
    const manager = await fixture.factories.user({ role: "MANAGER" });

    if (stationId) {
      await fixture.factories.userOrgAssignment({ userId: manager.id, stationId });
    }

    return fixture.auth.makeAccessToken({ userId: manager.id, role: "MANAGER" });
  }

  async function createTechnicianToken(stationId?: string) {
    const technician = await fixture.factories.user({ role: "TECHNICIAN" });

    if (stationId) {
      const team = await fixture.factories.technicianTeam({ stationId });
      await fixture.factories.userOrgAssignment({ userId: technician.id, technicianTeamId: team.id });
    }

    return fixture.auth.makeAccessToken({ userId: technician.id, role: "TECHNICIAN" });
  }

  async function createActiveReturnSlotAt(stationId: string) {
    const user = await fixture.factories.user({ role: "USER" });
    const rentalStation = await fixture.factories.station({ capacity: 2 });
    const bike = await fixture.factories.bike({
      stationId: rentalStation.id,
      status: "BOOKED",
    });
    const rental = await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: rentalStation.id,
      status: "RENTED",
    });

    await fixture.prisma.returnSlotReservation.create({
      data: {
        rentalId: rental.id,
        userId: user.id,
        stationId,
        reservedFrom: new Date(),
        status: "ACTIVE",
      },
    });
  }

  async function createIncomingRedistributionTo(targetStationId: string) {
    const requester = await fixture.factories.user({ role: "STAFF" });
    const sourceStation = await fixture.factories.station({
      name: "Redistribution Source",
      address: "15 Redistribution Street, Thu Duc, TP.HCM",
    });
    const bike = await fixture.factories.bike({
      stationId: sourceStation.id,
      status: "PENDING_DISPATCH",
    });

    await fixture.prisma.redistributionRequest.create({
      data: {
        requestedByUserId: requester.id,
        sourceStationId: sourceStation.id,
        targetStationId,
        requestedQuantity: 1,
        status: "APPROVED",
        items: {
          create: [{ bikeId: bike.id }],
        },
      },
    });
  }

  it("returns current operator station plus all other stations", async () => {
    const currentStation = await fixture.factories.station({
      name: "Current Station",
      address: "1 Current Street, Thu Duc, TP.HCM",
    });
    const otherStationA = await fixture.factories.station({
      name: "Alpha Station",
      address: "2 Alpha Street, Thu Duc, TP.HCM",
    });
    const otherStationB = await fixture.factories.station({
      name: "Beta Station",
      address: "3 Beta Street, Thu Duc, TP.HCM",
    });
    const token = await createStaffToken(currentStation.id);

    const response = await fixture.app.request("http://test/v1/operators/station-context", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as OperatorsContracts.OperatorStationContextResponse;

    expect(response.status).toBe(200);
    expect(body.currentStation).toEqual({
      id: currentStation.id,
      name: "Current Station",
      address: "1 Current Street, Thu Duc, TP.HCM",
      stationType: "INTERNAL",
      operationalAvailableSlots: expect.any(Number),
    });
    expect(body.otherStations).toEqual(expect.arrayContaining([
      {
        id: otherStationA.id,
        name: "Alpha Station",
        address: "2 Alpha Street, Thu Duc, TP.HCM",
        stationType: "INTERNAL",
        operationalAvailableSlots: expect.any(Number),
      },
      {
        id: otherStationB.id,
        name: "Beta Station",
        address: "3 Beta Street, Thu Duc, TP.HCM",
        stationType: "INTERNAL",
        operationalAvailableSlots: expect.any(Number),
      },
    ]));
    expect(body.otherStations.some(station => station.id === currentStation.id)).toBe(false);
  });

  it("returns operational available slots for redistribution decisions", async () => {
    const currentStation = await fixture.factories.station({
      name: "Operator Home",
      address: "16 Operator Street, Thu Duc, TP.HCM",
      capacity: 6,
      returnSlotLimit: 6,
    });
    const targetStation = await fixture.factories.station({
      name: "Redistribution Target",
      address: "17 Target Street, Thu Duc, TP.HCM",
      capacity: 5,
      returnSlotLimit: 3,
    });

    await fixture.factories.bike({ stationId: targetStation.id });
    await fixture.factories.bike({ stationId: targetStation.id });
    await createActiveReturnSlotAt(targetStation.id);
    await createIncomingRedistributionTo(targetStation.id);

    const token = await createStaffToken(currentStation.id);
    const response = await fixture.app.request("http://test/v1/operators/station-context", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as OperatorsContracts.OperatorStationContextResponse;
    const otherStation = body.otherStations.find(station => station.id === targetStation.id);

    expect(response.status).toBe(200);
    expect(otherStation).toEqual({
      id: targetStation.id,
      name: "Redistribution Target",
      address: "17 Target Street, Thu Duc, TP.HCM",
      stationType: "INTERNAL",
      operationalAvailableSlots: 1,
    });
  });

  it("returns 404 when operator has no station assignment", async () => {
    const token = await createStaffToken();

    const response = await fixture.app.request("http://test/v1/operators/station-context", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(404);
  });

  it("allows managers to read station context for their assigned station", async () => {
    const currentStation = await fixture.factories.station({
      name: "Manager Station",
      address: "9 Manager Street, Thu Duc, TP.HCM",
    });
    const otherStation = await fixture.factories.station({
      name: "Context Station",
      address: "10 Context Street, Thu Duc, TP.HCM",
    });
    const token = await createManagerToken(currentStation.id);

    const response = await fixture.app.request("http://test/v1/operators/station-context", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as OperatorsContracts.OperatorStationContextResponse;

    expect(response.status).toBe(200);
    expect(body.currentStation.id).toBe(currentStation.id);
    expect(body.currentStation.stationType).toBe("INTERNAL");
    expect(body.otherStations.some(station => station.id === otherStation.id)).toBe(true);
  });

  it("allows agency to read station context for its assigned station", async () => {
    const agency = await fixture.prisma.agency.create({
      data: {
        name: "Agency Context",
        status: "ACTIVE",
      },
    });
    const currentStation = await fixture.factories.station({
      name: "Agency Station",
      address: "11 Agency Street, Thu Duc, TP.HCM",
      stationType: "AGENCY",
      agencyId: agency.id,
    });
    const otherStation = await fixture.factories.station({
      name: "Agency Other Station",
      address: "12 Agency Street, Thu Duc, TP.HCM",
    });
    const agencyUser = await fixture.factories.user({ role: "AGENCY" });
    await fixture.factories.userOrgAssignment({ userId: agencyUser.id, agencyId: agency.id });
    const token = fixture.auth.makeAccessToken({ userId: agencyUser.id, role: "AGENCY" });

    const response = await fixture.app.request("http://test/v1/operators/station-context", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as OperatorsContracts.OperatorStationContextResponse;

    expect(response.status).toBe(200);
    expect(body.currentStation.id).toBe(currentStation.id);
    expect(body.currentStation.stationType).toBe("AGENCY");
    expect(body.otherStations.find(station => station.id === otherStation.id)?.stationType).toBe("INTERNAL");
    expect(body.otherStations.some(station => station.id === otherStation.id)).toBe(true);
  });

  it("allows technicians to read station context for their assigned station", async () => {
    const currentStation = await fixture.factories.station({
      name: "Technician Station",
      address: "13 Technician Street, Thu Duc, TP.HCM",
    });
    const otherStation = await fixture.factories.station({
      name: "Technician Other Station",
      address: "14 Technician Street, Thu Duc, TP.HCM",
    });
    const token = await createTechnicianToken(currentStation.id);

    const response = await fixture.app.request("http://test/v1/operators/station-context", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as OperatorsContracts.OperatorStationContextResponse;

    expect(response.status).toBe(200);
    expect(body.currentStation.id).toBe(currentStation.id);
    expect(body.currentStation.stationType).toBe("INTERNAL");
    expect(body.otherStations.some(station => station.id === otherStation.id)).toBe(true);
  });

  it("rejects regular users", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    const response = await fixture.app.request("http://test/v1/operators/station-context", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(403);
  });
});
