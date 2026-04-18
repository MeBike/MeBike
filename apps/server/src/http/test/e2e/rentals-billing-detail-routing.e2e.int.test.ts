import type { RentalsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("rentals billing detail routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { RentalDepsLive } = await import("@/http/shared/providers");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(
        UserDepsLive,
        RentalDepsLive,
      );
    },
  });

  async function createCompletedRentalWithBilling(input?: {
    readonly couponRule?: {
      readonly id: string;
      readonly name: string;
      readonly minRidingMinutes: number;
      readonly discountValue: string;
      readonly priority?: number;
    };
    readonly prepaidAmount?: string;
    readonly subscriptionApplied?: boolean;
    readonly subscriptionDiscountAmount?: string;
    readonly couponDiscountAmount?: string;
    readonly totalAmount?: string;
    readonly totalDurationMinutes?: number;
  }) {
    const user = await fixture.factories.user({ role: "USER" });
    await fixture.factories.wallet({ userId: user.id, balance: 100_000n });

    const pricingPolicy = await fixture.prisma.pricingPolicy.findFirstOrThrow({
      where: { status: "ACTIVE" },
      select: { id: true },
    });

    const station = await fixture.factories.station({ capacity: 5 });
    const bike = await fixture.factories.bike({
      stationId: station.id,
      status: "AVAILABLE",
    });

    const totalDurationMinutes = input?.totalDurationMinutes ?? 95;
    const endTime = new Date("2026-04-17T09:35:00.000Z");
    const startTime = new Date(endTime.getTime() - totalDurationMinutes * 60 * 1000);

    const reservation = input?.prepaidAmount
      ? await fixture.factories.reservation({
          userId: user.id,
          bikeId: bike.id,
          stationId: station.id,
          pricingPolicyId: pricingPolicy.id,
          startTime,
          prepaid: input.prepaidAmount,
          status: "FULFILLED",
        })
      : null;

    const subscription = input?.subscriptionApplied
      ? await fixture.factories.subscription({
          userId: user.id,
          status: "ACTIVE",
        })
      : null;

    const rental = await fixture.factories.rental({
      userId: user.id,
      reservationId: reservation?.id ?? null,
      bikeId: bike.id,
      pricingPolicyId: pricingPolicy.id,
      startStationId: station.id,
      endStationId: station.id,
      startTime,
      endTime,
      duration: totalDurationMinutes,
      totalPrice: input?.totalAmount ?? "6000",
      subscriptionId: subscription?.id ?? null,
      status: "COMPLETED",
    });

    await fixture.prisma.rentalBillingRecord.create({
      data: {
        rentalId: rental.id,
        pricingPolicyId: pricingPolicy.id,
        totalDurationMinutes,
        estimatedDistanceKm: null,
        baseAmount: "8000",
        couponRuleId: input?.couponRule?.id ?? null,
        ...(input?.couponRule
          ? {
              couponRuleSnapshot: {
                ruleId: input.couponRule.id,
                name: input.couponRule.name,
                triggerType: "RIDING_DURATION",
                minRidingMinutes: input.couponRule.minRidingMinutes,
                discountType: "FIXED_AMOUNT",
                discountValue: Number(input.couponRule.discountValue),
                priority: input.couponRule.priority ?? 100,
                billableMinutes: totalDurationMinutes,
                billableHours: totalDurationMinutes / 60,
                appliedAt: endTime.toISOString(),
              },
            }
          : {}),
        couponDiscountAmount: input?.couponDiscountAmount ?? "2000",
        subscriptionDiscountAmount: input?.subscriptionDiscountAmount ?? "0",
        depositForfeited: false,
        totalAmount: input?.totalAmount ?? "6000",
        createdAt: endTime,
      },
    });

    return {
      rental,
      user,
      token: fixture.auth.makeAccessToken({ userId: user.id, role: "USER" }),
    };
  }

  it("returns finalized billing detail for a completed rental with coupon data", async () => {
    const couponRule = await fixture.prisma.couponRule.create({
      data: {
        name: "Ride 2h discount",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
        discountValue: "2000",
        status: "ACTIVE",
        priority: 90,
      },
    });
    const graph = await createCompletedRentalWithBilling({
      couponRule: {
        id: couponRule.id,
        name: couponRule.name,
        minRidingMinutes: couponRule.minRidingMinutes!,
        discountValue: couponRule.discountValue.toString(),
        priority: couponRule.priority,
      },
    });

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${graph.rental.id}/billing-detail`,
      {
        headers: {
          Authorization: `Bearer ${graph.token}`,
        },
      },
    );

    const body = await response.json() as RentalsContracts.RentalBillingDetail;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      rentalId: graph.rental.id,
      baseAmount: 8000,
      prepaidAmount: 0,
      subscriptionApplied: false,
      subscriptionDiscountAmount: 0,
      couponRuleId: couponRule.id,
      couponRuleName: "Ride 2h discount",
      couponRuleMinRidingMinutes: 120,
      couponRuleDiscountType: "FIXED_AMOUNT",
      couponRuleDiscountValue: 2000,
      couponDiscountAmount: 2000,
      totalAmount: 6000,
      appliedAt: "2026-04-17T09:35:00.000Z",
    });
    expect(body.explanation).toContain("Ride 2h discount");
    expect(body.explanation).toContain("2000");
  });

  it("returns finalized billing detail with null coupon fields when no coupon was applied", async () => {
    const graph = await createCompletedRentalWithBilling({
      couponDiscountAmount: "0",
      totalAmount: "8000",
    });

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${graph.rental.id}/billing-detail`,
      {
        headers: {
          Authorization: `Bearer ${graph.token}`,
        },
      },
    );

    const body = await response.json() as RentalsContracts.RentalBillingDetail;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      rentalId: graph.rental.id,
      couponRuleId: null,
      couponRuleName: null,
      couponRuleMinRidingMinutes: null,
      couponRuleDiscountType: null,
      couponRuleDiscountValue: null,
      couponDiscountAmount: 0,
      totalAmount: 8000,
    });
    expect(body.explanation).toContain("No prepaid amount");
  });

  it("returns finalized billing detail with subscription discount data", async () => {
    const graph = await createCompletedRentalWithBilling({
      subscriptionApplied: true,
      subscriptionDiscountAmount: "3000",
      couponDiscountAmount: "0",
      totalAmount: "5000",
    });

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${graph.rental.id}/billing-detail`,
      {
        headers: {
          Authorization: `Bearer ${graph.token}`,
        },
      },
    );

    const body = await response.json() as RentalsContracts.RentalBillingDetail;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      rentalId: graph.rental.id,
      subscriptionApplied: true,
      subscriptionDiscountAmount: 3000,
      couponDiscountAmount: 0,
      totalAmount: 5000,
    });
    expect(body.explanation).toContain("Subscription reduced this rental by 3000");
  });

  it("returns 400 when billing detail is requested for an active rental", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    await fixture.factories.wallet({ userId: user.id, balance: 100_000n });
    const station = await fixture.factories.station({ capacity: 5 });
    const bike = await fixture.factories.bike({
      stationId: station.id,
      status: "BOOKED",
    });
    const rental = await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      status: "RENTED",
    });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${rental.id}/billing-detail`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Billing detail requires a completed rental",
      details: {
        code: "BILLING_DETAIL_REQUIRES_COMPLETED_RENTAL",
        rentalId: rental.id,
        status: "RENTED",
      },
    });
  });

  it("returns 404 when requesting another user's finalized billing detail", async () => {
    const graph = await createCompletedRentalWithBilling();
    const otherUser = await fixture.factories.user({ role: "USER" });
    const otherToken = fixture.auth.makeAccessToken({ userId: otherUser.id, role: "USER" });

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${graph.rental.id}/billing-detail`,
      {
        headers: {
          Authorization: `Bearer ${otherToken}`,
        },
      },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Rental not found",
      details: {
        code: "RENTAL_NOT_FOUND",
        rentalId: graph.rental.id,
      },
    });
  });

  it("returns 404 when the rental does not exist", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });
    const missingRentalId = "019b17bd-d130-7e7d-be69-91ceef7b6999";

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${missingRentalId}/billing-detail`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Rental not found",
      details: {
        code: "RENTAL_NOT_FOUND",
        rentalId: missingRentalId,
      },
    });
  });

  it("returns 400 when a completed rental has no finalized billing record yet", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    await fixture.factories.wallet({ userId: user.id, balance: 100_000n });
    const station = await fixture.factories.station({ capacity: 5 });
    const bike = await fixture.factories.bike({
      stationId: station.id,
      status: "AVAILABLE",
    });
    const rental = await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      endStationId: station.id,
      duration: 90,
      totalPrice: "6000",
      status: "COMPLETED",
      endTime: new Date("2026-04-17T09:35:00.000Z"),
    });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${rental.id}/billing-detail`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Billing detail is not ready",
      details: {
        code: "BILLING_DETAIL_NOT_READY",
        rentalId: rental.id,
        status: "COMPLETED",
      },
    });
  });
});
