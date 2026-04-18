import type { StationsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("operator stations routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { StationDepsLive } = await import("@/http/shared/providers");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(
        UserDepsLive,
        StationDepsLive,
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

  it("lists only the assigned station for staff", async () => {
    const currentStation = await fixture.factories.station({ capacity: 5, name: "Current Station" });
    await fixture.factories.station({ capacity: 5, name: "Hidden Station" });
    const token = await createOperatorToken("STAFF", currentStation.id);

    const response = await fixture.app.request("http://test/v1/staff/stations?page=1&pageSize=20", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as StationsContracts.StationListResponse;

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.id).toBe(currentStation.id);
  });

  it("returns 404 when technician requests a different station detail", async () => {
    const currentStation = await fixture.factories.station({ capacity: 5 });
    const hiddenStation = await fixture.factories.station({ capacity: 5 });
    const token = await createOperatorToken("TECHNICIAN", currentStation.id);

    const response = await fixture.app.request(`http://test/v1/staff/stations/${hiddenStation.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(404);
  });
});
