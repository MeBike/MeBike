import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("operator bikes routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const {
        BikeDepsLive,
        RatingDepsLive,
        StationDepsLive,
        SupplierDepsLive,
      } = await import("@/http/shared/providers");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(
        UserDepsLive,
        BikeDepsLive,
        RatingDepsLive,
        StationDepsLive,
        SupplierDepsLive,
      );
    },
  });

  async function createOperatorToken(role: "STAFF" | "MANAGER" | "TECHNICIAN", stationId?: string) {
    const user = await fixture.factories.user({ role });

    if (stationId) {
      await fixture.factories.userOrgAssignment({ userId: user.id, stationId });
    }

    return fixture.auth.makeAccessToken({ userId: user.id, role });
  }

  async function createAgencyContext() {
    const agencyUser = await fixture.factories.user({ role: "AGENCY" });
    const agency = await fixture.prisma.agency.create({
      data: {
        name: `Agency ${agencyUser.id}`,
        contactPhone: "0281234567",
        status: "ACTIVE",
      },
    });

    await fixture.factories.userOrgAssignment({ userId: agencyUser.id, agencyId: agency.id });

    return {
      agency,
      agencyUser,
      token: fixture.auth.makeAccessToken({ userId: agencyUser.id, role: "AGENCY" }),
    };
  }

  it("lists only bikes from the assigned station for technician", async () => {
    const visibleStation = await fixture.factories.station({ capacity: 5 });
    const hiddenStation = await fixture.factories.station({ capacity: 5 });
    const visibleBike = await fixture.factories.bike({ stationId: visibleStation.id, status: "AVAILABLE" });
    await fixture.factories.bike({ stationId: hiddenStation.id, status: "AVAILABLE" });
    const token = await createOperatorToken("TECHNICIAN", visibleStation.id);

    const response = await fixture.app.request("http://test/v1/staff/bikes?page=1&pageSize=20", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as { data: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.id).toBe(visibleBike.id);
  });

  it("returns 404 when manager requests bike detail outside their station", async () => {
    const visibleStation = await fixture.factories.station({ capacity: 5 });
    const hiddenStation = await fixture.factories.station({ capacity: 5 });
    const hiddenBike = await fixture.factories.bike({ stationId: hiddenStation.id, status: "AVAILABLE" });
    const token = await createOperatorToken("MANAGER", visibleStation.id);

    const response = await fixture.app.request(`http://test/v1/staff/bikes/${hiddenBike.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(404);
  });

  it("allows manager to toggle an in-scope bike from available to broken", async () => {
    const station = await fixture.factories.station({ capacity: 5 });
    const bike = await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const token = await createOperatorToken("MANAGER", station.id);

    const response = await fixture.app.request(`http://test/v1/manager/bikes/${bike.id}/status`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "BROKEN" }),
    });

    const body = await response.json() as { status: string };

    expect(response.status).toBe(200);
    expect(body.status).toBe("BROKEN");
  });

  it("returns 400 when manager requests an invalid status transition", async () => {
    const station = await fixture.factories.station({ capacity: 5 });
    const bike = await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const token = await createOperatorToken("MANAGER", station.id);

    const response = await fixture.app.request(`http://test/v1/manager/bikes/${bike.id}/status`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "AVAILABLE" }),
    });

    const body = await response.json() as { details?: { code?: string } };

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("INVALID_BIKE_STATUS");
  });

  it("returns 400 when manager sends a status outside the contract", async () => {
    const station = await fixture.factories.station({ capacity: 5 });
    const bike = await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const token = await createOperatorToken("MANAGER", station.id);

    const response = await fixture.app.request(`http://test/v1/manager/bikes/${bike.id}/status`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "BOOKED" }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 404 when manager updates a rented bike outside station scope", async () => {
    const station = await fixture.factories.station({ capacity: 5 });
    const bike = await fixture.factories.bike({ stationId: null, status: "BOOKED" });
    const token = await createOperatorToken("MANAGER", station.id);

    const response = await fixture.app.request(`http://test/v1/manager/bikes/${bike.id}/status`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "BROKEN" }),
    });

    expect(response.status).toBe(404);
  });

  it("allows agency to toggle a bike in its assigned station", async () => {
    const { agency, token } = await createAgencyContext();
    const station = await fixture.factories.station({
      stationType: "AGENCY",
      capacity: 5,
      agencyId: agency.id,
    });
    const bike = await fixture.factories.bike({ stationId: station.id, status: "BROKEN" });

    const response = await fixture.app.request(`http://test/v1/agency/bikes/${bike.id}/status`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "AVAILABLE" }),
    });

    const body = await response.json() as { status: string };

    expect(response.status).toBe(200);
    expect(body.status).toBe("AVAILABLE");
  });

  it("returns 404 when agency updates a bike outside its station scope", async () => {
    const { agency, token } = await createAgencyContext();
    await fixture.factories.station({
      stationType: "AGENCY",
      capacity: 5,
      agencyId: agency.id,
    });
    const otherAgency = await fixture.prisma.agency.create({
      data: {
        name: `Other Agency ${agency.id}`,
        contactPhone: "0287654321",
        status: "ACTIVE",
      },
    });
    const otherStation = await fixture.factories.station({
      stationType: "AGENCY",
      capacity: 5,
      agencyId: otherAgency.id,
    });
    const bike = await fixture.factories.bike({ stationId: otherStation.id, status: "AVAILABLE" });

    const response = await fixture.app.request(`http://test/v1/agency/bikes/${bike.id}/status`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "BROKEN" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 400 when agency requests an invalid status transition", async () => {
    const { agency, token } = await createAgencyContext();
    const station = await fixture.factories.station({
      stationType: "AGENCY",
      capacity: 5,
      agencyId: agency.id,
    });
    const bike = await fixture.factories.bike({ stationId: station.id, status: "BROKEN" });

    const response = await fixture.app.request(`http://test/v1/agency/bikes/${bike.id}/status`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "BROKEN" }),
    });

    const body = await response.json() as { details?: { code?: string } };

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("INVALID_BIKE_STATUS");
  });
});
