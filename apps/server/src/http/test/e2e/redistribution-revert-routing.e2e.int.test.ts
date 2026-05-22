import type { RedistributionContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("redistribution revert routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const {
        StationDepsLive,
        UserDepsLive,
        RedistributionRequestDepsLive,
      } = await import("@/http/shared/providers");

      return Layer.mergeAll(
        StationDepsLive,
        UserDepsLive,
        RedistributionRequestDepsLive,
      );
    },
  });

  async function createManagerToken(stationId?: string) {
    const manager = await fixture.factories.user({ role: "MANAGER" });

    if (stationId) {
      await fixture.factories.userOrgAssignment({ userId: manager.id, stationId });
    }

    return fixture.auth.makeAccessToken({ userId: manager.id, role: "MANAGER" });
  }

  it("successfully reverts remaining transporting bikes and updates status to REVERTED with reason", async () => {
    // 1. Create source and target stations
    const sourceStation = await fixture.factories.station({
      name: "Source Station",
      capacity: 5,
    });
    const targetStation = await fixture.factories.station({
      name: "Target Station",
      capacity: 5,
    });

    // 2. Create manager token assigned to the target station
    const manager = await fixture.factories.user({ role: "MANAGER" });
    await fixture.factories.userOrgAssignment({ userId: manager.id, stationId: targetStation.id });
    const token = await fixture.auth.makeAccessToken({ userId: manager.id, role: "MANAGER" });

    // 3. Create a bike at the source station in TRANSPORTING status
    const bike = await fixture.factories.bike({
      stationId: sourceStation.id,
      status: "TRANSPORTING",
    });

    // 4. Create a redistribution request
    const requester = await fixture.factories.user({ role: "STAFF" });
    const request = await fixture.prisma.redistributionRequest.create({
      data: {
        requestedByUserId: requester.id,
        sourceStationId: sourceStation.id,
        targetStationId: targetStation.id,
        requestedQuantity: 1,
        status: "IN_TRANSIT",
        reason: "Original request reason",
        items: {
          create: [{ bikeId: bike.id }],
        },
      },
    });

    // 5. Invoke the revert endpoint
    const response = await fixture.app.request(
      `http://test/v1/redistribution-requests/${request.id}/revert-remaining`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: "Too long to deliver and not needed anymore",
        }),
      },
    );

    expect(response.status).toBe(200);

    const body = await response.json() as RedistributionContracts.RedistributionRequestDetail;
    expect(body.status).toBe("REVERTED");
    expect(body.reason).toBe("Too long to deliver and not needed anymore");
    expect(body.revertedByUser).not.toBeNull();
    expect(body.revertedByUser?.id).toBe(manager.id);
    expect(body.revertedBikes).toBe(1);

    // 6. Verify the request in database is updated
    const updatedRequest = await fixture.prisma.redistributionRequest.findUnique({
      where: { id: request.id },
    });
    expect(updatedRequest?.status).toBe("REVERTED");
    expect(updatedRequest?.reason).toBe("Too long to deliver and not needed anymore");
    expect(updatedRequest?.revertedByUserId).toBe(manager.id);
    expect(updatedRequest?.completedAt).not.toBeNull();

    // 7. Verify the bike status reverted to AVAILABLE
    const updatedBike = await fixture.prisma.bike.findUnique({
      where: { id: bike.id },
    });
    expect(updatedBike?.status).toBe("AVAILABLE");
  });
});
