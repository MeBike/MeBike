import type { SuppliersContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("supplier stats summary e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { SupplierDepsLive } = await import("@/http/shared/features/supplier.layers");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(
        PrismaLive,
        SupplierDepsLive,
        UserDepsLive,
      );
    },
  });

  it("admin can read /v1/suppliers/stats/summary", async () => {
    const admin = await fixture.factories.user({ role: "ADMIN" });

    await fixture.factories.supplier({ status: "ACTIVE" });
    await fixture.factories.supplier({ status: "ACTIVE" });
    await fixture.factories.supplier({ status: "INACTIVE" });
    await fixture.factories.supplier({ status: "TERMINATED" });

    const token = fixture.auth.makeAccessToken({ userId: admin.id, role: "ADMIN" });

    const response = await fixture.app.request("http://test/v1/suppliers/stats/summary", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as SuppliersContracts.SupplierStatusSummary;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      active: 2,
      inactive: 1,
    });
  });

  it("non-admin gets 403 for /v1/suppliers/stats/summary", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    const response = await fixture.app.request("http://test/v1/suppliers/stats/summary", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(403);
  });

  it("anonymous gets 401 for /v1/suppliers/stats/summary", async () => {
    const response = await fixture.app.request("http://test/v1/suppliers/stats/summary", {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });
});
