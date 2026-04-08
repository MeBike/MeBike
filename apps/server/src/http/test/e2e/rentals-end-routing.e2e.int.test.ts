import type { RentalsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("rentals end routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { RentalDepsLive } = await import("@/http/shared/providers");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(
        UserDepsLive,
        RentalDepsLive,
      );
    },
  });

  async function createActiveRentalGraph() {
    const user = await fixture.factories.user({ role: "USER" });
    await fixture.factories.wallet({ userId: user.id, balance: 100_000n });

    const startStation = await fixture.factories.station({ capacity: 5 });
    const bike = await fixture.factories.bike({
      stationId: startStation.id,
      status: "BOOKED",
    });

    const rental = await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: startStation.id,
      startTime: new Date("2026-03-21T08:00:00.000Z"),
      status: "RENTED",
    });

    return { user, startStation, bike, rental };
  }

  async function createAdminToken() {
    const admin = await fixture.factories.user({ role: "ADMIN" });
    return fixture.auth.makeAccessToken({ userId: admin.id, role: "ADMIN" });
  }

  async function createStaffToken(stationId?: string) {
    const staff = await fixture.factories.user({ role: "STAFF" });

    if (stationId) {
      await fixture.factories.userOrgAssignment({ userId: staff.id, stationId });
    }

    return {
      staff,
      token: fixture.auth.makeAccessToken({ userId: staff.id, role: "STAFF" }),
    };
  }

  async function createAgencyToken() {
    const agencyUser = await fixture.factories.user({ role: "AGENCY" });
    const agency = await fixture.prisma.agency.create({
      data: {
        name: `Agency ${agencyUser.id}`,
        contactPhone: "0281234567",
        status: "ACTIVE",
      },
    });
    const station = await fixture.factories.station({
      name: `Agency Station ${agencyUser.id}`,
      stationType: "AGENCY",
      agencyId: agency.id,
    });

    await fixture.factories.userOrgAssignment({
      userId: agencyUser.id,
      agencyId: agency.id,
    });

    return {
      agency,
      agencyUser,
      station,
      token: fixture.auth.makeAccessToken({ userId: agencyUser.id, role: "AGENCY" }),
    };
  }

  async function createReturnSlot(token: string, rentalId: string, stationId: string) {
    return fixture.app.request(`http://test/v1/rentals/me/${rentalId}/return-slot`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId }),
    });
  }

  async function createBikeSwapRequestGraph(options: {
    stationType: "INTERNAL" | "AGENCY";
  }) {
    const renter = await fixture.factories.user({ role: "USER" });
    await fixture.factories.wallet({ userId: renter.id, balance: 100_000n });

    let agencyId: string | null = null;
    if (options.stationType === "AGENCY") {
      const agency = await fixture.prisma.agency.create({
        data: {
          name: `Swap Agency ${renter.id}`,
          contactPhone: "0287654321",
          status: "ACTIVE",
        },
      });
      agencyId = agency.id;
    }

    const station = await fixture.factories.station({
      name: `${options.stationType} Swap Station ${renter.id}`,
      stationType: options.stationType,
      agencyId,
      capacity: 6,
    });

    const oldBike = await fixture.factories.bike({
      stationId: station.id,
      status: "BOOKED",
    });
    const replacementBike = await fixture.factories.bike({
      stationId: station.id,
      status: "AVAILABLE",
    });
    const rental = await fixture.factories.rental({
      userId: renter.id,
      bikeId: oldBike.id,
      startStationId: station.id,
      startTime: new Date("2026-03-21T08:00:00.000Z"),
      status: "RENTED",
    });

    const bikeSwapRequest = await fixture.prisma.bikeSwapRequest.create({
      data: {
        rentalId: rental.id,
        userId: renter.id,
        oldBikeId: oldBike.id,
        stationId: station.id,
        status: "PENDING",
      },
    });

    return {
      renter,
      station,
      oldBike,
      replacementBike,
      rental,
      bikeSwapRequest,
      agencyId,
    };
  }

  it("includes the active return slot in admin rental detail", async () => {
    const { user, rental } = await createActiveRentalGraph();
    const userToken = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });
    const adminToken = await createAdminToken();
    const reservedStation = await fixture.factories.station({ capacity: 5 });

    const slotResponse = await createReturnSlot(userToken, rental.id, reservedStation.id);
    expect(slotResponse.status).toBe(200);

    const response = await fixture.app.request(`http://test/v1/admin/rentals/${rental.id}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const body = await response.json() as RentalsContracts.RentalDetail;

    expect(response.status).toBe(200);
    expect(body.id).toBe(rental.id);
    expect(body.returnSlot?.station.id).toBe(reservedStation.id);
    expect(body.returnSlot?.status).toBe("ACTIVE");
  });

  it("lists my bike swap requests without being shadowed by the rental detail route", async () => {
    const { user, rental } = await createActiveRentalGraph();
    const userToken = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/bike-swap-requests?page=1&pageSize=20&rentalId=${rental.id}`,
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      },
    );

    const body = await response.json() as RentalsContracts.BikeSwapRequestListResponse;

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.pagination.page).toBe(1);
  });

  it("rejects operator confirmation at a station different from the active return slot", async () => {
    const { user, rental } = await createActiveRentalGraph();
    const userToken = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });
    const reservedStation = await fixture.factories.station({ capacity: 5 });
    const attemptedStation = await fixture.factories.station({ capacity: 5 });
    const { token: staffToken } = await createStaffToken(attemptedStation.id);

    const slotResponse = await createReturnSlot(userToken, rental.id, reservedStation.id);
    expect(slotResponse.status).toBe(200);

    const response = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId: attemptedStation.id, confirmationMethod: "MANUAL" }),
    });

    const body = await response.json() as RentalsContracts.RentalErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("RETURN_SLOT_STATION_MISMATCH");
    expect(body.details?.rentalId).toBe(rental.id);
    expect(body.details?.returnSlotStationId).toBe(reservedStation.id);
    expect(body.details?.endStationId).toBe(attemptedStation.id);
  });

  it("confirms a rental return successfully when the active return slot matches the target station", async () => {
    const { user, rental, bike } = await createActiveRentalGraph();
    const userToken = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });
    const targetStation = await fixture.factories.station({ capacity: 5 });
    const { token: staffToken } = await createStaffToken(targetStation.id);
    const confirmedAt = new Date("2026-03-21T08:30:00.000Z").toISOString();

    const slotResponse = await createReturnSlot(userToken, rental.id, targetStation.id);
    expect(slotResponse.status).toBe(200);

    const response = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId: targetStation.id, confirmationMethod: "MANUAL", confirmedAt }),
    });

    const body = await response.json() as RentalsContracts.RentalDetail;

    expect(response.status).toBe(200);
    expect(body.id).toBe(rental.id);
    expect(body.status).toBe("COMPLETED");
    expect(body.endStation?.id).toBe(targetStation.id);

    const persistedSlot = await fixture.prisma.returnSlotReservation.findFirst({
      where: { rentalId: rental.id },
    });
    expect(persistedSlot?.status).toBe("USED");

    const persistedConfirmation = await fixture.prisma.returnConfirmation.findUnique({
      where: { rentalId: rental.id },
    });
    expect(persistedConfirmation?.stationId).toBe(targetStation.id);
    expect(persistedConfirmation?.handoverStatus).toBe("CONFIRMED");
    expect(persistedConfirmation?.confirmationMethod).toBe("MANUAL");

    const persistedBike = await fixture.prisma.bike.findUnique({ where: { id: bike.id } });
    expect(persistedBike?.status).toBe("AVAILABLE");
    expect(persistedBike?.stationId).toBe(targetStation.id);
  });

  it("rejects staff confirmation when the staff assignment does not match the reserved return station", async () => {
    const { user, rental } = await createActiveRentalGraph();
    const userToken = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });
    const reservedStation = await fixture.factories.station({ capacity: 5 });
    const otherStation = await fixture.factories.station({ capacity: 5 });
    const { token: staffToken } = await createStaffToken(otherStation.id);

    const slotResponse = await createReturnSlot(userToken, rental.id, reservedStation.id);
    expect(slotResponse.status).toBe(200);

    const response = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId: reservedStation.id, confirmationMethod: "MANUAL" }),
    });

    const body = await response.json() as RentalsContracts.RentalErrorResponse;

    expect(response.status).toBe(403);
    expect(body.details?.code).toBe("ACCESS_DENIED");
    expect(body.details?.stationId).toBe(reservedStation.id);
  });

  it("allows staff confirmation when the staff assignment matches the reserved return station", async () => {
    const { user, rental } = await createActiveRentalGraph();
    const userToken = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });
    const reservedStation = await fixture.factories.station({ capacity: 5 });
    const { token: staffToken } = await createStaffToken(reservedStation.id);
    const confirmedAt = new Date("2026-03-21T08:30:00.000Z").toISOString();

    const slotResponse = await createReturnSlot(userToken, rental.id, reservedStation.id);
    expect(slotResponse.status).toBe(200);

    const response = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId: reservedStation.id, confirmationMethod: "MANUAL", confirmedAt }),
    });

    expect(response.status).toBe(200);
  });

  it("enforces the same return-slot rule on the operator end rental endpoint", async () => {
    const { rental, startStation } = await createActiveRentalGraph();
    const { token: staffToken } = await createStaffToken(startStation.id);

    const response = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId: startStation.id, confirmationMethod: "MANUAL" }),
    });

    const body = await response.json() as RentalsContracts.RentalErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("RETURN_SLOT_REQUIRED_FOR_RETURN");
    expect(body.details?.rentalId).toBe(rental.id);
    expect(body.details?.endStationId).toBe(startStation.id);
  });

  it("rejects duplicate operator confirmation for the same rental", async () => {
    const { user, rental } = await createActiveRentalGraph();
    const userToken = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });
    const targetStation = await fixture.factories.station({ capacity: 5 });
    const { token: staffToken } = await createStaffToken(targetStation.id);
    const confirmedAt = new Date("2026-03-21T08:30:00.000Z").toISOString();

    const slotResponse = await createReturnSlot(userToken, rental.id, targetStation.id);
    expect(slotResponse.status).toBe(200);

    const firstResponse = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId: targetStation.id, confirmedAt }),
    });
    expect(firstResponse.status).toBe(200);

    const secondResponse = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId: targetStation.id, confirmedAt }),
    });

    const body = await secondResponse.json() as RentalsContracts.RentalErrorResponse;

    expect(secondResponse.status).toBe(400);
    expect(body.details?.code).toBe("NOT_FOUND_RENTED_RENTAL");
  });

  it("rejects admin confirmation because the operator route is limited to staff and agency", async () => {
    const { rental, startStation } = await createActiveRentalGraph();
    const adminToken = await createAdminToken();

    const response = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId: startStation.id, confirmationMethod: "MANUAL" }),
    });

    expect(response.status).toBe(403);
  });

  it("allows agency confirmation when the reserved return station belongs to the agency", async () => {
    const { user, rental } = await createActiveRentalGraph();
    const userToken = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });
    const { station, token: agencyToken } = await createAgencyToken();
    const confirmedAt = new Date("2026-03-21T08:30:00.000Z").toISOString();

    const slotResponse = await createReturnSlot(userToken, rental.id, station.id);
    expect(slotResponse.status).toBe(200);

    const response = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${agencyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stationId: station.id,
        confirmationMethod: "MANUAL",
        confirmedAt,
      }),
    });

    expect(response.status).toBe(200);
  });

  it("allows staff approval for bike swap requests at their internal station", async () => {
    const { station, bikeSwapRequest, rental, oldBike, replacementBike } = await createBikeSwapRequestGraph({
      stationType: "INTERNAL",
    });
    const { token: staffToken } = await createStaffToken(station.id);

    const response = await fixture.app.request(
      `http://test/v1/operators/bike-swap-requests/${bikeSwapRequest.id}/approve`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${staffToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    const body = await response.json() as RentalsContracts.BikeSwapRequestDetailResponse;

    expect(response.status).toBe(200);
    expect(body.result.status).toBe("CONFIRMED");
    expect(body.result.newBike?.id).toBe(replacementBike.id);

    const persistedRequest = await fixture.prisma.bikeSwapRequest.findUnique({
      where: { id: bikeSwapRequest.id },
    });
    expect(persistedRequest?.status).toBe("CONFIRMED");
    expect(persistedRequest?.newBikeId).toBe(replacementBike.id);

    const persistedRental = await fixture.prisma.rental.findUnique({
      where: { id: rental.id },
    });
    expect(persistedRental?.bikeId).toBe(replacementBike.id);

    const persistedOldBike = await fixture.prisma.bike.findUnique({
      where: { id: oldBike.id },
    });
    expect(persistedOldBike?.status).toBe("BROKEN");

    const persistedReplacementBike = await fixture.prisma.bike.findUnique({
      where: { id: replacementBike.id },
    });
    expect(persistedReplacementBike?.status).toBe("BOOKED");

    expect(body.result.station?.id).toBe(station.id);
  });

  it("allows agency approval for bike swap requests at its agency station", async () => {
    const { station, bikeSwapRequest, replacementBike, agencyId } = await createBikeSwapRequestGraph({
      stationType: "AGENCY",
    });
    const agencyUser = await fixture.factories.user({ role: "AGENCY" });
    await fixture.factories.userOrgAssignment({
      userId: agencyUser.id,
      agencyId: agencyId!,
    });
    const agencyToken = fixture.auth.makeAccessToken({
      userId: agencyUser.id,
      role: "AGENCY",
    });

    const response = await fixture.app.request(
      `http://test/v1/operators/bike-swap-requests/${bikeSwapRequest.id}/approve`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${agencyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    const body = await response.json() as RentalsContracts.BikeSwapRequestDetailResponse;

    expect(response.status).toBe(200);
    expect(body.result.status).toBe("CONFIRMED");
    expect(body.result.newBike?.id).toBe(replacementBike.id);
    expect(body.result.station?.id).toBe(station.id);
  });

  it("rejects staff approval for bike swap requests that belong to an agency station", async () => {
    const { bikeSwapRequest } = await createBikeSwapRequestGraph({
      stationType: "AGENCY",
    });
    const internalStation = await fixture.factories.station({ capacity: 5 });
    const { token: staffToken } = await createStaffToken(internalStation.id);

    const response = await fixture.app.request(
      `http://test/v1/operators/bike-swap-requests/${bikeSwapRequest.id}/approve`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${staffToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    const body = await response.json() as RentalsContracts.BikeSwapRequestErrorResponse;

    expect(response.status).toBe(404);
    expect(body.details?.code).toBe("BIKE_SWAP_REQUEST_NOT_FOUND");
  });

  it("lists bike swap requests for both staff and agency through the shared operator route", async () => {
    const internalGraph = await createBikeSwapRequestGraph({
      stationType: "INTERNAL",
    });
    const agencyGraph = await createBikeSwapRequestGraph({
      stationType: "AGENCY",
    });
    const { token: staffToken } = await createStaffToken(internalGraph.station.id);
    const agencyUser = await fixture.factories.user({ role: "AGENCY" });
    await fixture.factories.userOrgAssignment({
      userId: agencyUser.id,
      agencyId: agencyGraph.agencyId!,
    });
    const agencyToken = fixture.auth.makeAccessToken({
      userId: agencyUser.id,
      role: "AGENCY",
    });

    const staffResponse = await fixture.app.request(
      "http://test/v1/operators/bike-swap-requests?page=1&pageSize=20",
      {
        headers: {
          Authorization: `Bearer ${staffToken}`,
        },
      },
    );
    const agencyResponse = await fixture.app.request(
      "http://test/v1/operators/bike-swap-requests?page=1&pageSize=20",
      {
        headers: {
          Authorization: `Bearer ${agencyToken}`,
        },
      },
    );

    const staffBody = await staffResponse.json() as RentalsContracts.BikeSwapRequestListResponse;
    const agencyBody = await agencyResponse.json() as RentalsContracts.BikeSwapRequestListResponse;

    expect(staffResponse.status).toBe(200);
    expect(staffBody.data.map(item => item.id)).toContain(internalGraph.bikeSwapRequest.id);
    expect(staffBody.data.map(item => item.id)).not.toContain(agencyGraph.bikeSwapRequest.id);

    expect(agencyResponse.status).toBe(200);
    expect(agencyBody.data.map(item => item.id)).toContain(agencyGraph.bikeSwapRequest.id);
    expect(agencyBody.data.map(item => item.id)).not.toContain(internalGraph.bikeSwapRequest.id);
  });
});
