import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("admin bikes routing e2e", () => {
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

  async function createToken(role: "ADMIN" | "USER") {
    const user = await fixture.factories.user({ role });
    return {
      user,
      token: fixture.auth.makeAccessToken({ userId: user.id, role }),
    };
  }

  async function createActiveReturnSlotAt(stationId: string) {
    const user = await fixture.factories.user({ role: "USER" });
    const rentalStation = await fixture.factories.station({ capacity: 2 });
    const supplier = await fixture.factories.supplier();
    const bike = await fixture.factories.bike({
      stationId: rentalStation.id,
      supplierId: supplier.id,
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

  it("returns 403 for non-admin bike mutations", async () => {
    const { token } = await createToken("USER");
    const station = await fixture.factories.station({ capacity: 5 });
    const supplier = await fixture.factories.supplier();
    const bike = await fixture.factories.bike({ stationId: station.id, supplierId: supplier.id });

    const updateResponse = await fixture.app.request(`http://test/v1/bikes/${bike.id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "BROKEN" }),
    });

    const deleteResponse = await fixture.app.request(`http://test/v1/bikes/${bike.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(updateResponse.status).toBe(403);
    expect(deleteResponse.status).toBe(403);
  });

  it("rejects bike creation when destination station has no placement space after reserved returns", async () => {
    const { token } = await createToken("ADMIN");
    const station = await fixture.factories.station({ capacity: 1, returnSlotLimit: 0 });
    const supplier = await fixture.factories.supplier();

    await createActiveReturnSlotAt(station.id);

    const response = await fixture.app.request("http://test/v1/bikes", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stationId: station.id,
        supplierId: supplier.id,
        status: "AVAILABLE",
      }),
    });

    const body = await response.json() as {
      details?: {
        code?: string;
        availablePlacementSlots?: number;
        requiredPlacementSlots?: number;
      };
    };

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("BIKE_STATION_PLACEMENT_CAPACITY_EXCEEDED");
    expect(body.details?.availablePlacementSlots).toBe(0);
    expect(body.details?.requiredPlacementSlots).toBe(1);
  });
});
