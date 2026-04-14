import type { StatsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("stats summary e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(
        UserDepsLive,
        PrismaLive,
      );
    },
  });

  it("anonymous can read /v1/stats/summary", async () => {
    const response = await fixture.app.request("http://test/v1/stats/summary", {
      method: "GET",
    });

    const body = await response.json() as StatsContracts.StatsSummaryResponse;

    expect(response.status).toBe(200);
    expect(body.totalStations).toBeTypeOf("number");
    expect(body.totalBikes).toBeTypeOf("number");
    expect(body.totalUsers).toBeTypeOf("number");
  });
});
