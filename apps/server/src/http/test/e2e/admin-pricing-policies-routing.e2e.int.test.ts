import type { PricingPoliciesContracts } from "@mebike/shared";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toPrismaDecimal } from "@/domain/shared/decimal";
import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "0195c768-3456-7f01-8234-aaaaaaaaaaaa";
const USER_USER_ID = "0195c768-3456-7f01-8234-bbbbbbbbbbbb";

describe("admin pricing policies routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PricingDepsLive } = await import("@/http/shared/features/pricing.layers");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(
        PricingDepsLive,
        UserDepsLive,
      );
    },
    seedData: async (_db, prisma) => {
      await prisma.user.createMany({
        data: [
          {
            id: ADMIN_USER_ID,
            fullName: "Pricing Admin",
            email: "pricing-admin@example.com",
            passwordHash: "hash123",
            phoneNumber: null,
            username: null,
            avatarUrl: null,
            locationText: null,
            nfcCardUid: null,
            role: "ADMIN",
            accountStatus: "ACTIVE",
            verifyStatus: "VERIFIED",
          },
          {
            id: USER_USER_ID,
            fullName: "Pricing User",
            email: "pricing-user@example.com",
            passwordHash: "hash123",
            phoneNumber: null,
            username: null,
            avatarUrl: null,
            locationText: null,
            nfcCardUid: null,
            role: "USER",
            accountStatus: "ACTIVE",
            verifyStatus: "VERIFIED",
          },
        ],
      });
    },
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-20T08:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function authHeaders(role: "ADMIN" | "USER" = "ADMIN") {
    const userId = role === "ADMIN" ? ADMIN_USER_ID : USER_USER_ID;
    const token = fixture.auth.makeAccessToken({ userId, role });

    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  it("creates an inactive pricing policy draft during daytime", async () => {
    const response = await fixture.app.request("http://test/v1/admin/pricing-policies", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        name: "  Daytime Draft  ",
        base_rate: 2200,
        billing_unit_minutes: 45,
        reservation_fee: 2500,
        deposit_required: 550000,
        late_return_cutoff: "22:30",
      }),
    });
    const body = await response.json() as PricingPoliciesContracts.PricingPolicy;

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      name: "Daytime Draft",
      base_rate: 2200,
      billing_unit_minutes: 45,
      reservation_fee: 2500,
      deposit_required: 550000,
      late_return_cutoff: "22:30:00",
      status: "INACTIVE",
    });
  });

  it("rejects create when money fields are below practical VND minimum", async () => {
    const response = await fixture.app.request("http://test/v1/admin/pricing-policies", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        name: "Too Cheap Draft",
        base_rate: 1,
        billing_unit_minutes: 30,
        reservation_fee: 1,
        deposit_required: 1,
        late_return_cutoff: "22:30",
      }),
    });
    const body = await response.json() as {
      details?: { code?: string; issues?: Array<{ path?: string }> };
    };

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("PRICING_POLICY_INVALID_INPUT");
    expect(body.details?.issues?.map(issue => issue.path)).toEqual([
      "baseRate",
      "reservationFee",
      "depositRequired",
    ]);
  });

  it("rejects negative create values through pricing-policy service validation", async () => {
    const response = await fixture.app.request("http://test/v1/admin/pricing-policies", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        name: "Negative Draft",
        base_rate: -1000,
        billing_unit_minutes: -30,
        reservation_fee: 2000,
        deposit_required: 500000,
        late_return_cutoff: "22:30",
      }),
    });
    const body = await response.json() as {
      details?: { code?: string; issues?: Array<{ path?: string }> };
    };

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe("PRICING_POLICY_INVALID_INPUT");
    expect(body.details?.issues?.map(issue => issue.path)).toEqual([
      "baseRate",
      "billingUnitMinutes",
    ]);
  });

  it("rejects non-admin access", async () => {
    const response = await fixture.app.request("http://test/v1/admin/pricing-policies", {
      method: "GET",
      headers: authHeaders("USER"),
    });

    expect(response.status).toBe(403);
  });

  it("lists pricing policies with optional status filter", async () => {
    await fixture.factories.pricingPolicy({
      name: "Inactive Pricing Policy",
      status: "INACTIVE",
    });

    const response = await fixture.app.request("http://test/v1/admin/pricing-policies?status=INACTIVE", {
      method: "GET",
      headers: authHeaders(),
    });
    const body = await response.json() as PricingPoliciesContracts.PricingPolicyListResponse;

    expect(response.status).toBe(200);
    expect(body.data.every(policy => policy.status === "INACTIVE")).toBe(true);
  });

  it("returns pricing policy detail with usage summary", async () => {
    const policy = await fixture.factories.pricingPolicy({
      name: "Usage Detail Policy",
      status: "INACTIVE",
    });
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();

    await fixture.factories.reservation({
      userId: user.id,
      stationId: station.id,
      pricingPolicyId: policy.id,
    });

    const response = await fixture.app.request(`http://test/v1/admin/pricing-policies/${policy.id}`, {
      method: "GET",
      headers: authHeaders(),
    });
    const body = await response.json() as PricingPoliciesContracts.PricingPolicyDetail;

    expect(response.status).toBe(200);
    expect(body.id).toBe(policy.id);
    expect(body.usage_summary).toEqual({
      reservation_count: 1,
      rental_count: 0,
      billing_record_count: 0,
      is_used: true,
    });
  });

  it("updates an unused pricing policy during daytime", async () => {
    const policy = await fixture.factories.pricingPolicy({
      name: "Mutable Pricing Policy",
      status: "INACTIVE",
    });

    const response = await fixture.app.request(`http://test/v1/admin/pricing-policies/${policy.id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({
        name: "Mutable Pricing Policy v2",
        base_rate: 2800,
        late_return_cutoff: "21:45:00",
      }),
    });
    const body = await response.json() as PricingPoliciesContracts.PricingPolicy;

    expect(response.status).toBe(200);
    expect(body.name).toBe("Mutable Pricing Policy v2");
    expect(body.base_rate).toBe(2800);
    expect(body.late_return_cutoff).toBe("21:45:00");
  });

  it("blocks updating a used pricing policy", async () => {
    const policy = await fixture.factories.pricingPolicy({
      name: "Used Pricing Policy",
      status: "INACTIVE",
    });
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();

    await fixture.factories.reservation({
      userId: user.id,
      stationId: station.id,
      pricingPolicyId: policy.id,
    });

    const response = await fixture.app.request(`http://test/v1/admin/pricing-policies/${policy.id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({
        name: "Should Fail",
      }),
    });
    const body = await response.json() as PricingPoliciesContracts.PricingPolicyErrorResponse;

    expect(response.status).toBe(409);
    expect(body.details.code).toBe("PRICING_POLICY_ALREADY_USED");
    expect(body.details.pricingPolicyId).toBe(policy.id);
  });

  it("returns the current active pricing policy", async () => {
    const response = await fixture.app.request("http://test/v1/admin/pricing-policies/active", {
      method: "GET",
      headers: authHeaders(),
    });
    const body = await response.json() as PricingPoliciesContracts.PricingPolicy;

    expect(response.status).toBe(200);
    expect(body.status).toBe("ACTIVE");
    expect(body.name).toBe("Default Pricing Policy");
  });

  it("blocks activation outside overnight window", async () => {
    const policy = await fixture.factories.pricingPolicy({
      name: "Blocked Activation Policy",
      status: "INACTIVE",
    });

    const response = await fixture.app.request(`http://test/v1/admin/pricing-policies/${policy.id}/activate`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    const body = await response.json() as PricingPoliciesContracts.PricingPolicyErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details.code).toBe("PRICING_POLICY_MUTATION_WINDOW_CLOSED");
  });

  it("activates a pricing policy during overnight window and deactivates the previous one", async () => {
    vi.setSystemTime(new Date("2026-04-20T16:30:00.000Z"));

    const policy = await fixture.factories.pricingPolicy({
      name: "Next Active Pricing Policy",
      status: "INACTIVE",
    });
    const oldActive = await fixture.prisma.pricingPolicy.findFirstOrThrow({
      where: { status: "ACTIVE" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    const response = await fixture.app.request(`http://test/v1/admin/pricing-policies/${policy.id}/activate`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    const body = await response.json() as PricingPoliciesContracts.PricingPolicy;

    expect(response.status).toBe(200);
    expect(body.id).toBe(policy.id);
    expect(body.status).toBe("ACTIVE");

    const oldRow = await fixture.prisma.pricingPolicy.findUniqueOrThrow({
      where: { id: oldActive.id },
    });
    const newRow = await fixture.prisma.pricingPolicy.findUniqueOrThrow({
      where: { id: policy.id },
    });

    expect(oldRow.status).toBe("INACTIVE");
    expect(newRow.status).toBe("ACTIVE");
  });

  it("counts billing-record references when blocking updates", async () => {
    const policy = await fixture.factories.pricingPolicy({
      name: "Billing Used Policy",
      status: "INACTIVE",
    });
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const rental = await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      pricingPolicyId: null,
      status: "COMPLETED",
      endStationId: station.id,
      endTime: new Date("2026-04-21T04:00:00.000Z"),
      duration: 60,
      totalPrice: "5000",
    });

    await fixture.prisma.rentalBillingRecord.create({
      data: {
        rentalId: rental.id,
        pricingPolicyId: policy.id,
        totalDurationMinutes: 60,
        estimatedDistanceKm: null,
        baseAmount: toPrismaDecimal("7000"),
        couponRuleId: null,
        couponDiscountAmount: toPrismaDecimal("0"),
        subscriptionDiscountAmount: toPrismaDecimal("0"),
        depositForfeited: false,
        totalAmount: toPrismaDecimal("5000"),
      },
    });

    const response = await fixture.app.request(`http://test/v1/admin/pricing-policies/${policy.id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({
        reservation_fee: 3000,
      }),
    });
    const body = await response.json() as PricingPoliciesContracts.PricingPolicyErrorResponse;

    expect(response.status).toBe(409);
    expect(body.details.billingRecordCount).toBe(1);
  });
});
