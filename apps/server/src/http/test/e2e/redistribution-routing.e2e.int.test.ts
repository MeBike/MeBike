import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("redistribution routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(PrismaLive, UserDepsLive);
    },
  });

  it("returns 401 for unauthenticated requests to me list", async () => {
    const response = await fixture.app.request("http://test/v1/redistribution-requests/me", {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });

  it("allows authenticated user to create a redistribution request", async () => {
    const user = await fixture.factories.user({ role: "STAFF" });
    const station = await fixture.factories.station({ capacity: 5 });
    await fixture.factories.userOrgAssignment({
      userId: user.id,
      stationId: station.id,
    });
    // Create 2 available bikes to satisfy redistribution requirements (requested: 1, min rest: 1)
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "STAFF" });

    const response = await fixture.app.request("http://test/v1/redistribution-requests", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestedByUserId: user.id,
        sourceStationId: station.id,
        targetStationId: station.id,
        requestedQuantity: 1,
        reason: "Balance adjustment",
      }),
    });

    const body = (await response.json()) as { message?: string; result?: { sourceStationId?: string } };

    expect(response.status).toBe(201);
    expect(body.message).toBe("Redistribution request created successfully");
    expect(body.result?.sourceStationId).toBe(station.id);
  });
});
