import type { RedistributionContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("redistribution requests prioritisation e2e", () => {
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

  it("prioritises pending redistribution requests correctly based on the 5-minute rule and custom formula", async () => {
    // 1. Create source and target stations
    // Station A: Source in Hanoi
    const sourceStation = await fixture.factories.station({
      name: "Source Station Hanoi",
      latitude: 21.0285,
      longitude: 105.8542,
      capacity: 10,
    });
    // Station B: Target close to source (~1.3km)
    const targetCloseStation = await fixture.factories.station({
      name: "Target Close Hanoi",
      latitude: 21.0333,
      longitude: 105.8433,
      capacity: 10,
    });
    // Station C: Target very far (~1160km)
    const targetFarStation = await fixture.factories.station({
      name: "Target Far HCMC",
      latitude: 10.7769,
      longitude: 106.7009,
      capacity: 10,
    });

    // 2. Create manager token assigned to sourceStation (so they can view all requests originating from this source)
    const manager = await fixture.factories.user({ role: "MANAGER" });
    await fixture.factories.userOrgAssignment({ userId: manager.id, stationId: sourceStation.id });
    const token = await fixture.auth.makeAccessToken({ userId: manager.id, role: "MANAGER" });

    const requester = await fixture.factories.user({ role: "STAFF" });

    const now = new Date();

    // 3. Create Request C: Sent 10 minutes ago (should come first due to > 5m rule)
    const requestC = await fixture.prisma.redistributionRequest.create({
      data: {
        requestedByUserId: requester.id,
        sourceStationId: sourceStation.id,
        targetStationId: targetCloseStation.id,
        requestedQuantity: 2,
        status: "PENDING_APPROVAL",
        reason: "Request C reason",
        createdAt: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
      },
    });

    // 4. Create Request A: Sent 1 minute ago, close station, quantity 5 (within 5 minutes, higher score)
    const requestA = await fixture.prisma.redistributionRequest.create({
      data: {
        requestedByUserId: requester.id,
        sourceStationId: sourceStation.id,
        targetStationId: targetCloseStation.id,
        requestedQuantity: 5,
        status: "PENDING_APPROVAL",
        reason: "Request A reason",
        createdAt: new Date(now.getTime() - 1 * 60 * 1000), // 1 minute ago
      },
    });

    // 5. Create Request B: Sent now, far station, quantity 1 (within 5 minutes, lower score)
    const requestB = await fixture.prisma.redistributionRequest.create({
      data: {
        requestedByUserId: requester.id,
        sourceStationId: sourceStation.id,
        targetStationId: targetFarStation.id,
        requestedQuantity: 1,
        status: "PENDING_APPROVAL",
        reason: "Request B reason",
        createdAt: now,
      },
    });

    // 6. Invoke manager list endpoint
    const response = await fixture.app.request(
      "http://test/v1/manager/redistribution-requests?status=PENDING_APPROVAL",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.status !== 200) {
      console.error("Response failed:", await response.text());
    }

    expect(response.status).toBe(200);

    const body = await response.json() as RedistributionContracts.RedistributionRequestList;
    const items = body.data;

    // We should receive all three requests
    expect(items.length).toBe(3);

    // Verify priorityScore and priorityLevel are populated
    expect(items[0].priorityScore).toBeTypeOf("number");
    expect(items[1].priorityScore).toBeTypeOf("number");
    expect(items[2].priorityScore).toBeTypeOf("number");

    expect(items[0].priorityLevel).toBe("HIGH");
    expect(items[1].priorityLevel).toBe("HIGH");
    expect(items[2].priorityLevel).toBe("LOW");

    // Order verification:
    // Request C (earliest by 10 minutes) must be index 0
    expect(items[0].id).toBe(requestC.id);

    // Request A (close station, quantity 5) has a much higher score than Request B (far station, quantity 1)
    // Request A must be index 1, Request B must be index 2
    expect(items[1].id).toBe(requestA.id);
    expect(items[2].id).toBe(requestB.id);

    expect(items[1].priorityScore).toBeGreaterThan(items[2].priorityScore!);
  });
});
