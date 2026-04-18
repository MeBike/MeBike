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
});
