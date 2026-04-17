import type { ReservationsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("operator reservations routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { ReservationDepsLive } = await import("@/http/shared/providers");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(
        UserDepsLive,
        ReservationDepsLive,
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

  it("lets manager use the staff reservations list but only for their station", async () => {
    const visibleStation = await fixture.factories.station({ capacity: 5 });
    const hiddenStation = await fixture.factories.station({ capacity: 5 });
    const riderA = await fixture.factories.user({ role: "USER" });
    const riderB = await fixture.factories.user({ role: "USER" });
    const bikeA = await fixture.factories.bike({ stationId: visibleStation.id, status: "RESERVED" });
    const bikeB = await fixture.factories.bike({ stationId: hiddenStation.id, status: "RESERVED" });

    const visibleReservation = await fixture.factories.reservation({
      userId: riderA.id,
      bikeId: bikeA.id,
      stationId: visibleStation.id,
    });
    await fixture.factories.reservation({
      userId: riderB.id,
      bikeId: bikeB.id,
      stationId: hiddenStation.id,
    });

    const managerToken = await createManagerToken(visibleStation.id);

    const response = await fixture.app.request("http://test/v1/staff/reservations?page=1&pageSize=20", {
      headers: {
        Authorization: `Bearer ${managerToken}`,
      },
    });

    const body = await response.json() as ReservationsContracts.ListStaffReservationsResponse;

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.id).toBe(visibleReservation.id);
  });

  it("returns 404 when staff requests reservation detail outside their station", async () => {
    const visibleStation = await fixture.factories.station({ capacity: 5 });
    const hiddenStation = await fixture.factories.station({ capacity: 5 });
    const rider = await fixture.factories.user({ role: "USER" });
    const hiddenBike = await fixture.factories.bike({ stationId: hiddenStation.id, status: "RESERVED" });
    const reservation = await fixture.factories.reservation({
      userId: rider.id,
      bikeId: hiddenBike.id,
      stationId: hiddenStation.id,
    });
    const staffToken = await createStaffToken(visibleStation.id);

    const response = await fixture.app.request(`http://test/v1/staff/reservations/${reservation.id}`, {
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
    });

    expect(response.status).toBe(404);
  });
});
