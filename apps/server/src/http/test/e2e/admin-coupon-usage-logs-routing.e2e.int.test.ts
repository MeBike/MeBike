import type {
  CouponsContracts,
  ServerErrorResponse,
} from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018fa100-0000-7000-8000-00000000e001";
const USER_USER_ID = "018fa100-0000-7000-8000-00000000e002";

describe("admin coupon usage logs routing e2e", () => {
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
            fullName: "Admin Coupon Usage Logs",
            email: "admin-coupon-usage@example.com",
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
            fullName: "Coupon Usage User",
            email: "coupon-usage-user@example.com",
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
    readonly appliedAt: string;
    readonly couponDiscountAmount: string;
    readonly couponRule?: {
      readonly id: string;
      readonly name: string;
      readonly minRidingMinutes: number | null;
      readonly discountValue: { toString: () => string };
      readonly priority: number;
    };
    readonly totalDurationMinutes?: number;
    readonly baseAmount?: string;
    readonly prepaidAmount?: string;
    readonly subscriptionDiscountAmount?: string;
    readonly totalAmount?: string;
    readonly endTime?: string;
    readonly userId?: string;
    readonly rentalId?: string;
    readonly subscriptionApplied?: boolean;
  }) {
    const pricingPolicy = await fixture.prisma.pricingPolicy.findFirstOrThrow({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });

    const customer = input.userId
      ? { id: input.userId }
      : await fixture.factories.user();
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({
      stationId: station.id,
      status: "AVAILABLE",
    });

    const appliedAt = new Date(input.appliedAt);
    const endTime = input.endTime ? new Date(input.endTime) : appliedAt;
    const totalDurationMinutes = input.totalDurationMinutes ?? 60;
    const startTime = new Date(endTime.getTime() - totalDurationMinutes * 60 * 1000);

    const reservation = input.prepaidAmount
      ? await fixture.factories.reservation({
          userId: customer.id,
          stationId: station.id,
          bikeId: bike.id,
          pricingPolicyId: pricingPolicy.id,
          prepaid: input.prepaidAmount,
          startTime,
          status: "FULFILLED",
        })
      : null;

    const subscription = input.subscriptionApplied
      ? await fixture.factories.subscription({
          userId: customer.id,
          status: "ACTIVE",
        })
      : null;

    const rental = await fixture.factories.rental({
      id: input.rentalId,
      userId: customer.id,
      reservationId: reservation?.id,
      bikeId: bike.id,
      pricingPolicyId: pricingPolicy.id,
      startStationId: station.id,
      endStationId: station.id,
      startTime,
      endTime,
      duration: totalDurationMinutes,
      totalPrice: input.totalAmount ?? "9000",
      subscriptionId: subscription?.id ?? null,
      status: "COMPLETED",
    });

    await fixture.prisma.rentalBillingRecord.create({
      data: {
        rentalId: rental.id,
        pricingPolicyId: pricingPolicy.id,
        totalDurationMinutes,
        estimatedDistanceKm: null,
        baseAmount: input.baseAmount ?? "10000",
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
              billableMinutes: totalDurationMinutes,
              billableHours: totalDurationMinutes / 60,
              appliedAt: appliedAt.toISOString(),
            }
          : undefined,
        couponDiscountAmount: input.couponDiscountAmount,
        subscriptionDiscountAmount: input.subscriptionDiscountAmount ?? "0",
        depositForfeited: false,
        totalAmount: input.totalAmount ?? "9000",
        createdAt: appliedAt,
      },
    });

    return {
      pricingPolicyId: pricingPolicy.id,
      rentalId: rental.id,
      userId: customer.id,
      appliedAt,
    };
  }

  it("admin gets empty usage log list when no finalized discount records exist", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-usage-logs", {
      method: "GET",
      headers: authHeader(ADMIN_USER_ID, "ADMIN"),
    });
    const body = await response.json() as CouponsContracts.AdminCouponUsageLogsResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it("admin gets finalized usage logs ordered by billing createdAt desc with derived tiers", async () => {
    const tier1Rule = await createCouponRule({
      name: "Usage Snapshot 1h",
      minRidingMinutes: 60,
      discountValue: "1000",
    });
    const tier2Rule = await createCouponRule({
      name: "Usage Snapshot 2h",
      minRidingMinutes: 120,
      discountValue: "2000",
    });
    const tier4Rule = await createCouponRule({
      name: "Usage Snapshot 4h",
      minRidingMinutes: 240,
      discountValue: "4000",
    });
    const tier6Rule = await createCouponRule({
      name: "Usage Snapshot 6h",
      minRidingMinutes: 360,
      discountValue: "6000",
    });

    const tier1 = await createCompletedRentalWithBilling({
      appliedAt: "2026-04-17T09:01:00.000Z",
      couponDiscountAmount: "1000",
      couponRule: tier1Rule,
      totalAmount: "9000",
    });
    await createCompletedRentalWithBilling({
      appliedAt: "2026-04-17T09:02:00.000Z",
      couponDiscountAmount: "0",
      totalAmount: "10000",
    });
    const tier2 = await createCompletedRentalWithBilling({
      appliedAt: "2026-04-17T09:03:00.000Z",
      couponDiscountAmount: "2000",
      couponRule: tier2Rule,
      totalAmount: "6000",
      baseAmount: "8000",
      prepaidAmount: "0",
      totalDurationMinutes: 95,
    });
    const tier4 = await createCompletedRentalWithBilling({
      appliedAt: "2026-04-17T09:04:00.000Z",
      couponDiscountAmount: "4000",
      couponRule: tier4Rule,
      totalAmount: "5000",
      baseAmount: "9000",
    });
    const tier6 = await createCompletedRentalWithBilling({
      appliedAt: "2026-04-17T09:05:00.000Z",
      couponDiscountAmount: "6000",
      couponRule: tier6Rule,
      totalAmount: "4000",
      baseAmount: "10000",
      prepaidAmount: "2000",
      totalDurationMinutes: 360,
    });

    const response = await fixture.app.request("http://test/v1/admin/coupon-usage-logs", {
      method: "GET",
      headers: authHeader(ADMIN_USER_ID, "ADMIN"),
    });
    const body = await response.json() as CouponsContracts.AdminCouponUsageLogsResponse;

    expect(response.status).toBe(200);
    expect(body.pagination).toEqual({
      page: 1,
      pageSize: 20,
      total: 4,
      totalPages: 1,
    });
    expect(body.data.map(item => item.rentalId)).toEqual([
      tier6.rentalId,
      tier4.rentalId,
      tier2.rentalId,
      tier1.rentalId,
    ]);
    expect(body.data.map(item => ({
      discount: item.couponDiscountAmount,
      tier: item.derivedTier,
    }))).toEqual([
      { discount: 6000, tier: "TIER_6H_PLUS" },
      { discount: 4000, tier: "TIER_4H_6H" },
      { discount: 2000, tier: "TIER_2H_4H" },
      { discount: 1000, tier: "TIER_1H_2H" },
    ]);
    expect(body.data[0]).toMatchObject({
      rentalId: tier6.rentalId,
      userId: tier6.userId,
      pricingPolicyId: tier6.pricingPolicyId,
      rentalStatus: "COMPLETED",
      totalDurationMinutes: 360,
      baseAmount: 10000,
      prepaidAmount: 2000,
      subscriptionApplied: false,
      subscriptionDiscountAmount: 0,
      couponRuleId: tier6Rule.id,
      couponRuleName: "Usage Snapshot 6h",
      couponRuleMinRidingMinutes: 360,
      couponRuleDiscountType: "FIXED_AMOUNT",
      couponRuleDiscountValue: 6000,
      couponDiscountAmount: 6000,
      totalAmount: 4000,
      appliedAt: "2026-04-17T09:05:00.000Z",
    });
  });

  it("derives tier from coupon rule identity instead of capped discount amount", async () => {
    const tier2Rule = await createCouponRule({
      name: "Capped Snapshot 2h",
      minRidingMinutes: 120,
      discountValue: "2000",
    });

    const cappedTier2 = await createCompletedRentalWithBilling({
      appliedAt: "2026-04-17T10:00:00.000Z",
      couponDiscountAmount: "1000",
      couponRule: tier2Rule,
      baseAmount: "8000",
      prepaidAmount: "7000",
      totalAmount: "0",
      totalDurationMinutes: 95,
    });

    const response = await fixture.app.request(
      `http://test/v1/admin/coupon-usage-logs?rentalId=${cappedTier2.rentalId}`,
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const body = await response.json() as CouponsContracts.AdminCouponUsageLogsResponse;

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      rentalId: cappedTier2.rentalId,
      couponRuleId: tier2Rule.id,
      couponRuleName: "Capped Snapshot 2h",
      couponRuleMinRidingMinutes: 120,
      couponDiscountAmount: 1000,
      derivedTier: "TIER_2H_4H",
      rentalStatus: "COMPLETED",
    });
  });

  it("supports from/to, userId, rentalId, discountAmount, and subscriptionApplied filters", async () => {
    const filteredUser = await fixture.factories.user();
    const tier1Rule = await createCouponRule({
      name: "Filter Snapshot 1h",
      minRidingMinutes: 60,
      discountValue: "1000",
    });
    const tier2Rule = await createCouponRule({
      name: "Filter Snapshot 2h",
      minRidingMinutes: 120,
      discountValue: "2000",
    });
    const tier4Rule = await createCouponRule({
      name: "Filter Snapshot 4h",
      minRidingMinutes: 240,
      discountValue: "4000",
    });

    const outsideRange = await createCompletedRentalWithBilling({
      appliedAt: "2026-04-01T00:00:00.000Z",
      couponDiscountAmount: "1000",
      couponRule: tier1Rule,
    });
    const inRange = await createCompletedRentalWithBilling({
      appliedAt: "2026-04-10T08:00:00.000Z",
      couponDiscountAmount: "2000",
      couponRule: tier2Rule,
      userId: filteredUser.id,
    });
    const anomalyWithSubscription = await createCompletedRentalWithBilling({
      appliedAt: "2026-04-10T09:00:00.000Z",
      couponDiscountAmount: "4000",
      couponRule: tier4Rule,
      subscriptionApplied: true,
      subscriptionDiscountAmount: "1000",
      totalAmount: "3000",
    });

    const rangeResponse = await fixture.app.request(
      "http://test/v1/admin/coupon-usage-logs?from=2026-04-10&to=2026-04-10",
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const rangeBody = await rangeResponse.json() as CouponsContracts.AdminCouponUsageLogsResponse;

    expect(rangeResponse.status).toBe(200);
    expect(rangeBody.data.map(item => item.rentalId)).toEqual([
      anomalyWithSubscription.rentalId,
      inRange.rentalId,
    ]);

    const userResponse = await fixture.app.request(
      `http://test/v1/admin/coupon-usage-logs?userId=${filteredUser.id}`,
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const userBody = await userResponse.json() as CouponsContracts.AdminCouponUsageLogsResponse;

    expect(userResponse.status).toBe(200);
    expect(userBody.data).toHaveLength(1);
    expect(userBody.data[0]?.rentalId).toBe(inRange.rentalId);

    const rentalResponse = await fixture.app.request(
      `http://test/v1/admin/coupon-usage-logs?rentalId=${outsideRange.rentalId}`,
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const rentalBody = await rentalResponse.json() as CouponsContracts.AdminCouponUsageLogsResponse;

    expect(rentalResponse.status).toBe(200);
    expect(rentalBody.data).toHaveLength(1);
    expect(rentalBody.data[0]?.rentalId).toBe(outsideRange.rentalId);

    const amountResponse = await fixture.app.request(
      "http://test/v1/admin/coupon-usage-logs?discountAmount=4000",
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const amountBody = await amountResponse.json() as CouponsContracts.AdminCouponUsageLogsResponse;

    expect(amountResponse.status).toBe(200);
    expect(amountBody.data).toHaveLength(1);
    expect(amountBody.data[0]?.rentalId).toBe(anomalyWithSubscription.rentalId);

    const subscriptionResponse = await fixture.app.request(
      "http://test/v1/admin/coupon-usage-logs?subscriptionApplied=true",
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const subscriptionBody = await subscriptionResponse.json() as CouponsContracts.AdminCouponUsageLogsResponse;

    expect(subscriptionResponse.status).toBe(200);
    expect(subscriptionBody.data).toHaveLength(1);
    expect(subscriptionBody.data[0]).toMatchObject({
      rentalId: anomalyWithSubscription.rentalId,
      subscriptionApplied: true,
      subscriptionDiscountAmount: 1000,
    });
  });

  it("rejects invalid date ranges", async () => {
    const response = await fixture.app.request(
      "http://test/v1/admin/coupon-usage-logs?from=2026-04-11&to=2026-04-10",
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

  it("requires admin authentication", async () => {
    const missingTokenResponse = await fixture.app.request("http://test/v1/admin/coupon-usage-logs", {
      method: "GET",
    });

    expect(missingTokenResponse.status).toBe(401);

    const nonAdminResponse = await fixture.app.request("http://test/v1/admin/coupon-usage-logs", {
      method: "GET",
      headers: authHeader(USER_USER_ID, "USER"),
    });

    expect(nonAdminResponse.status).toBe(403);
  });
});
