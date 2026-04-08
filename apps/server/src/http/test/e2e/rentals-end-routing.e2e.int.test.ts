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
    const adminToken = await createAdminToken();
    const reservedStation = await fixture.factories.station({ capacity: 5 });
    const attemptedStation = await fixture.factories.station({ capacity: 5 });

    const slotResponse = await createReturnSlot(userToken, rental.id, reservedStation.id);
    expect(slotResponse.status).toBe(200);

    const response = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
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
    const adminToken = await createAdminToken();
    const targetStation = await fixture.factories.station({ capacity: 5 });
    const confirmedAt = new Date("2026-03-21T08:30:00.000Z").toISOString();

    const slotResponse = await createReturnSlot(userToken, rental.id, targetStation.id);
    expect(slotResponse.status).toBe(200);

    const response = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
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
      select: {
        stationId: true,
        confirmedByUserId: true,
        confirmationMethod: true,
        handoverStatus: true,
      },
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

  it("allows operator confirmation on the admin end rental endpoint without a return slot when the station has capacity", async () => {
    const { rental, startStation } = await createActiveRentalGraph();
    const adminToken = await createAdminToken();
    const confirmedAt = new Date("2026-03-21T08:30:00.000Z").toISOString();

    const response = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId: startStation.id, confirmationMethod: "MANUAL", confirmedAt }),
    });

    const body = await response.json() as RentalsContracts.RentalDetail;

    expect(response.status).toBe(200);
    expect(body.id).toBe(rental.id);
    expect(body.status).toBe("COMPLETED");
    expect(body.endStation?.id).toBe(startStation.id);
  });

  it("allows operator confirmation without a return slot when only the reservation limit is exhausted", async () => {
    const { rental } = await createActiveRentalGraph();
    const adminToken = await createAdminToken();
    const confirmedAt = new Date("2026-03-21T08:30:00.000Z").toISOString();
    const station = await fixture.factories.station({
      capacity: 5,
      pickupSlotLimit: 5,
      returnSlotLimit: 0,
    });

    const response = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId: station.id, confirmationMethod: "MANUAL", confirmedAt }),
    });

    const body = await response.json() as RentalsContracts.RentalDetail;

    expect(response.status).toBe(200);
    expect(body.status).toBe("COMPLETED");
    expect(body.endStation?.id).toBe(station.id);
  });

  it("rejects operator confirmation without a return slot when the station has no live capacity", async () => {
    const { rental } = await createActiveRentalGraph();
    const adminToken = await createAdminToken();
    const fullStation = await fixture.factories.station({
      capacity: 1,
      pickupSlotLimit: 1,
      returnSlotLimit: 1,
    });
    await fixture.factories.bike({ stationId: fullStation.id, status: "AVAILABLE" });

    const response = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId: fullStation.id, confirmationMethod: "MANUAL" }),
    });

    const body = await response.json() as RentalsContracts.RentalErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("RETURN_SLOT_CAPACITY_EXCEEDED");
    expect(body.details?.stationId).toBe(fullStation.id);
  });

  it("rejects duplicate operator confirmation for the same rental", async () => {
    const { user, rental } = await createActiveRentalGraph();
    const userToken = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });
    const adminToken = await createAdminToken();
    const targetStation = await fixture.factories.station({ capacity: 5 });
    const confirmedAt = new Date("2026-03-21T08:30:00.000Z").toISOString();

    const slotResponse = await createReturnSlot(userToken, rental.id, targetStation.id);
    expect(slotResponse.status).toBe(200);

    const firstResponse = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId: targetStation.id, confirmedAt }),
    });
    expect(firstResponse.status).toBe(200);

    const secondResponse = await fixture.app.request(`http://test/v1/rentals/${rental.id}/end`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId: targetStation.id, confirmedAt }),
    });

    const body = await secondResponse.json() as RentalsContracts.RentalErrorResponse;

    expect(secondResponse.status).toBe(400);
    expect(body.details?.code).toBe("NOT_FOUND_RENTED_RENTAL");
  });
});
