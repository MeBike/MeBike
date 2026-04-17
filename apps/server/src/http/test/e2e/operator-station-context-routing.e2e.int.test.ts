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
    });
    expect(body.otherStations).toEqual(expect.arrayContaining([
      {
        id: otherStationA.id,
        name: "Alpha Station",
        address: "2 Alpha Street, Thu Duc, TP.HCM",
      },
      {
        id: otherStationB.id,
        name: "Beta Station",
        address: "3 Beta Street, Thu Duc, TP.HCM",
      },
    ]));
    expect(body.otherStations.some(station => station.id === currentStation.id)).toBe(false);
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
