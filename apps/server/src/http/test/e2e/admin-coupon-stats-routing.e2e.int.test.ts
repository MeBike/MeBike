import type {
  CouponsContracts,
  ServerErrorResponse,
} from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018fa100-0000-7000-8000-00000000d001";
const USER_USER_ID = "018fa100-0000-7000-8000-00000000d002";

describe("admin coupon stats routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const {
        CouponDepsLive,
        UserDepsLive,
      } = await import("@/http/shared/providers");

      return Layer.mergeAll(
        CouponDepsLive,
        UserDepsLive,
      );
    },
    seedBase: false,
    seedData: async (_db, prisma) => {
      await prisma.user.createMany({
        data: [
          {
            id: ADMIN_USER_ID,
            fullName: "Admin Coupon Stats",
            email: "admin-coupon-stats@example.com",
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
            fullName: "Coupon Stats User",
            email: "coupon-stats-user@example.com",
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

  function authHeader(userId: string, role: "ADMIN" | "USER") {
    return fixture.auth.makeAuthHeader({ userId, role });
  }

  async function createCouponRule(input: {
    readonly name: string;
    readonly minRidingMinutes: number;
    readonly discountValue: string;
  }) {
    return fixture.prisma.couponRule.create({
      data: {
        name: input.name,
        triggerType: "RIDING_DURATION",
        minRidingMinutes: input.minRidingMinutes,
        discountType: "FIXED_AMOUNT",
        discountValue: input.discountValue,
        status: "ACTIVE",
        priority: 100,
      },
    });
  }

  async function createCompletedRentalWithBilling(input: {
    readonly endTime: string;
    readonly couponDiscountAmount: string;
    readonly couponRule?: {
      readonly id: string;
      readonly name: string;
      readonly minRidingMinutes: number | null;
      readonly discountValue: { toString: () => string };
      readonly priority: number;
    };
    readonly totalAmount?: string;
    readonly totalPrice?: string;
  }) {
    const pricingPolicy = await fixture.prisma.pricingPolicy.findFirstOrThrow({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });

    const customer = await fixture.factories.user();
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({
      stationId: station.id,
      status: "AVAILABLE",
    });

    const endTime = new Date(input.endTime);
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000);

    const rental = await fixture.factories.rental({
      userId: customer.id,
      bikeId: bike.id,
      pricingPolicyId: pricingPolicy.id,
      startStationId: station.id,
      endStationId: station.id,
      startTime,
      endTime,
      duration: 60,
      totalPrice: input.totalPrice ?? "9000",
      status: "COMPLETED",
    });

    await fixture.prisma.rentalBillingRecord.create({
      data: {
        rentalId: rental.id,
        pricingPolicyId: pricingPolicy.id,
        totalDurationMinutes: 60,
        estimatedDistanceKm: null,
        baseAmount: "10000",
        overtimeAmount: "0",
        couponRuleId: input.couponRule?.id,
        couponRuleSnapshot: input.couponRule
          ? {
              ruleId: input.couponRule.id,
              name: input.couponRule.name,
              triggerType: "RIDING_DURATION",
              minRidingMinutes: input.couponRule.minRidingMinutes ?? 0,
              discountType: "FIXED_AMOUNT",
              discountValue: Number(input.couponRule.discountValue.toString()),
              priority: input.couponRule.priority,
              billableMinutes: 60,
              billableHours: 1,
              appliedAt: endTime.toISOString(),
            }
          : undefined,
        couponDiscountAmount: input.couponDiscountAmount,
        subscriptionDiscountAmount: "0",
        depositForfeited: false,
        totalAmount: input.totalAmount ?? input.totalPrice ?? "9000",
        createdAt: endTime,
      },
    });

    return rental;
  }

  it("admin gets zeroed stats when there are no completed rentals", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-stats", {
      method: "GET",
      headers: authHeader(ADMIN_USER_ID, "ADMIN"),
    });
    const body = await response.json() as CouponsContracts.AdminCouponStatsResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      range: {
        from: null,
        to: null,
      },
      summary: {
        totalCompletedRentals: 0,
        discountedRentalsCount: 0,
        nonDiscountedRentalsCount: 0,
        discountRate: 0,
        totalDiscountAmount: 0,
        avgDiscountAmount: 0,
      },
      statsByRule: [],
      statsByDiscountAmount: [],
      topAppliedRule: null,
    });
  });

  it("admin gets summary stats and discount breakdown from finalized billing data", async () => {
    const tier1Rule = await createCouponRule({
      name: "Snapshot Ride 1h",
      minRidingMinutes: 60,
      discountValue: "1000",
    });
    const tier2Rule = await createCouponRule({
      name: "Snapshot Ride 2h",
      minRidingMinutes: 120,
      discountValue: "2000",
    });

    await createCompletedRentalWithBilling({
      endTime: "2026-04-10T08:00:00.000Z",
      couponDiscountAmount: "1000",
      couponRule: tier1Rule,
      totalPrice: "9000",
    });
    await createCompletedRentalWithBilling({
      endTime: "2026-04-11T08:00:00.000Z",
      couponDiscountAmount: "2000",
      couponRule: tier2Rule,
      totalPrice: "8000",
    });
    await createCompletedRentalWithBilling({
      endTime: "2026-04-12T08:00:00.000Z",
      couponDiscountAmount: "2000",
      couponRule: tier2Rule,
      totalPrice: "8000",
    });
    await createCompletedRentalWithBilling({
      endTime: "2026-04-13T08:00:00.000Z",
      couponDiscountAmount: "0",
      totalPrice: "10000",
    });

    const response = await fixture.app.request("http://test/v1/admin/coupon-stats", {
      method: "GET",
      headers: authHeader(ADMIN_USER_ID, "ADMIN"),
    });
    const body = await response.json() as CouponsContracts.AdminCouponStatsResponse;

    expect(response.status).toBe(200);
    expect(body.range).toEqual({
      from: null,
      to: null,
    });
    expect(body.summary).toEqual({
      totalCompletedRentals: 4,
      discountedRentalsCount: 3,
      nonDiscountedRentalsCount: 1,
      discountRate: 0.75,
      totalDiscountAmount: 5000,
      avgDiscountAmount: 1666.67,
    });
    expect(body.statsByDiscountAmount).toEqual([
      {
        discountAmount: 1000,
        rentalsCount: 1,
        totalDiscountAmount: 1000,
      },
      {
        discountAmount: 2000,
        rentalsCount: 2,
        totalDiscountAmount: 4000,
      },
    ]);
    expect(body.statsByRule).toEqual([
      {
        ruleId: tier2Rule.id,
        name: "Snapshot Ride 2h",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        minBillableHours: 2,
        discountType: "FIXED_AMOUNT",
        discountValue: 2000,
        appliedCount: 2,
        totalDiscountAmount: 4000,
        source: "BILLING_RECORD_SNAPSHOT",
      },
      {
        ruleId: tier1Rule.id,
        name: "Snapshot Ride 1h",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 60,
        minBillableHours: 1,
        discountType: "FIXED_AMOUNT",
        discountValue: 1000,
        appliedCount: 1,
        totalDiscountAmount: 1000,
        source: "BILLING_RECORD_SNAPSHOT",
      },
    ]);
    expect(body.topAppliedRule).toEqual({
      ruleId: tier2Rule.id,
      name: "Snapshot Ride 2h",
      triggerType: "RIDING_DURATION",
      minRidingMinutes: 120,
      minBillableHours: 2,
      discountType: "FIXED_AMOUNT",
      discountValue: 2000,
      appliedCount: 2,
      inferredFrom: "BILLING_RECORD_SNAPSHOT",
    });
  });

  it("completed rentals without discount stay in non-discounted counts", async () => {
    await createCompletedRentalWithBilling({
      endTime: "2026-04-15T08:00:00.000Z",
      couponDiscountAmount: "0",
      totalPrice: "10000",
    });

    const response = await fixture.app.request("http://test/v1/admin/coupon-stats", {
      method: "GET",
      headers: authHeader(ADMIN_USER_ID, "ADMIN"),
    });
    const body = await response.json() as CouponsContracts.AdminCouponStatsResponse;

    expect(response.status).toBe(200);
    expect(body.summary).toEqual({
      totalCompletedRentals: 1,
      discountedRentalsCount: 0,
      nonDiscountedRentalsCount: 1,
      discountRate: 0,
      totalDiscountAmount: 0,
      avgDiscountAmount: 0,
    });
    expect(body.statsByDiscountAmount).toEqual([]);
    expect(body.statsByRule).toEqual([]);
  });

  it("supports from/to filters against completed rental end time", async () => {
    const tier1Rule = await createCouponRule({
      name: "Range Ride 1h",
      minRidingMinutes: 60,
      discountValue: "1000",
    });
    const tier4Rule = await createCouponRule({
      name: "Range Ride 4h",
      minRidingMinutes: 240,
      discountValue: "4000",
    });
    const tier6Rule = await createCouponRule({
      name: "Range Ride 6h",
      minRidingMinutes: 360,
      discountValue: "6000",
    });

    await createCompletedRentalWithBilling({
      endTime: "2026-03-31T23:59:59.999Z",
      couponDiscountAmount: "1000",
      couponRule: tier1Rule,
      totalPrice: "9000",
    });
    await createCompletedRentalWithBilling({
      endTime: "2026-04-10T08:00:00.000Z",
      couponDiscountAmount: "4000",
      couponRule: tier4Rule,
      totalPrice: "6000",
    });
    await createCompletedRentalWithBilling({
      endTime: "2026-05-01T00:00:00.000Z",
      couponDiscountAmount: "6000",
      couponRule: tier6Rule,
      totalPrice: "4000",
    });

    const response = await fixture.app.request(
      "http://test/v1/admin/coupon-stats?from=2026-04-01&to=2026-04-30",
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const body = await response.json() as CouponsContracts.AdminCouponStatsResponse;

    expect(response.status).toBe(200);
    expect(body.range).toEqual({
      from: "2026-04-01T00:00:00.000Z",
      to: "2026-04-30T23:59:59.999Z",
    });
    expect(body.summary).toEqual({
      totalCompletedRentals: 1,
      discountedRentalsCount: 1,
      nonDiscountedRentalsCount: 0,
      discountRate: 1,
      totalDiscountAmount: 4000,
      avgDiscountAmount: 4000,
    });
    expect(body.statsByDiscountAmount).toEqual([
      {
        discountAmount: 4000,
        rentalsCount: 1,
        totalDiscountAmount: 4000,
      },
    ]);
    expect(body.statsByRule).toEqual([
      {
        ruleId: tier4Rule.id,
        name: "Range Ride 4h",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 240,
        minBillableHours: 4,
        discountType: "FIXED_AMOUNT",
        discountValue: 4000,
        appliedCount: 1,
        totalDiscountAmount: 4000,
        source: "BILLING_RECORD_SNAPSHOT",
      },
    ]);
  });

  it("returns validation error when only one date bound is provided", async () => {
    const response = await fixture.app.request(
      "http://test/v1/admin/coupon-stats?from=2026-04-01T00:00:00.000Z",
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 when token is missing", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-stats", {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });

  it("returns 403 when authenticated user is not admin", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-stats", {
      method: "GET",
      headers: authHeader(USER_USER_ID, "USER"),
    });

    expect(response.status).toBe(403);
  });
});
