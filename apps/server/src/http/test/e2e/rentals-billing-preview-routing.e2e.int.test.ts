import type { RentalsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const DEFAULT_PRICING_POLICY_ID = "11111111-1111-4111-8111-111111111111";

describe("rentals billing preview routing e2e", () => {
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

  async function createRentalGraph(options?: {
    readonly startOffsetMs?: number;
    readonly prepaid?: string;
    readonly withSubscription?: boolean;
    readonly rentalStatus?: "RENTED" | "COMPLETED" | "CANCELLED";
  }) {
    const user = await fixture.factories.user({ role: "USER" });
    await fixture.factories.wallet({ userId: user.id, balance: 100_000n });

    const station = await fixture.factories.station({ capacity: 5 });
    const bike = await fixture.factories.bike({
      stationId: station.id,
      status: "BOOKED",
    });

    const startTime = new Date(Date.now() - (options?.startOffsetMs ?? (125 * 60 * 1000 + 5000)));

    let reservationId: string | null = null;
    if (options?.prepaid) {
      const reservation = await fixture.factories.reservation({
        userId: user.id,
        bikeId: bike.id,
        stationId: station.id,
        startTime,
        prepaid: options.prepaid,
        status: "FULFILLED",
      });
      reservationId = reservation.id;
    }

    let subscriptionId: string | null = null;
    if (options?.withSubscription) {
      const subscription = await fixture.factories.subscription({
        userId: user.id,
        maxUsages: null,
        status: "ACTIVE",
      });
      subscriptionId = subscription.id;
    }

    const rental = await fixture.factories.rental({
      userId: user.id,
      reservationId,
      bikeId: bike.id,
      startStationId: station.id,
      startTime,
      subscriptionId,
      status: options?.rentalStatus ?? "RENTED",
    });

    return {
      user,
      station,
      bike,
      rental,
      startTime,
      token: fixture.auth.makeAccessToken({ userId: user.id, role: "USER" }),
    };
  }

  async function createDurationDiscountRule(input: {
    readonly code: string;
    readonly minRidingMinutes: number;
    readonly discountValue: string;
    readonly priority?: number;
  }) {
    const rule = await fixture.prisma.couponRule.create({
      data: {
        name: input.code,
        triggerType: "RIDING_DURATION",
        minRidingMinutes: input.minRidingMinutes,
        discountType: "FIXED_AMOUNT",
        discountValue: input.discountValue,
        status: "ACTIVE",
        priority: input.priority ?? 100,
      },
    });

    return { rule };
  }

  function getExpectedMinutes(previewedAt: string, startTime: Date) {
    return Math.max(
      1,
      Math.ceil((new Date(previewedAt).getTime() - startTime.getTime()) / 60000),
    );
  }

  function getExpectedBlocks(rentalMinutes: number) {
    return Math.max(1, Math.ceil(rentalMinutes / 30));
  }

  it("previews billing with the best eligible global discount rule for an active rental", async () => {
    const graph = await createRentalGraph();
    const lowTier = await createDurationDiscountRule({
      code: "RIDE-1H",
      minRidingMinutes: 60,
      discountValue: "1000",
      priority: 100,
    });
    const highTier = await createDurationDiscountRule({
      code: "RIDE-2H",
      minRidingMinutes: 120,
      discountValue: "2000",
      priority: 90,
    });

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${graph.rental.id}/billing-preview`,
      {
        headers: {
          Authorization: `Bearer ${graph.token}`,
        },
      },
    );

    const body = await response.json() as RentalsContracts.RentalBillingPreview;
    const expectedMinutes = getExpectedMinutes(body.previewedAt, graph.startTime);
    const expectedBlocks = getExpectedBlocks(expectedMinutes);
    const expectedBaseAmount = expectedBlocks * 2000;

    expect(response.status).toBe(200);
    expect(body.rentalId).toBe(graph.rental.id);
    expect(body.pricingPolicyId).toBe(DEFAULT_PRICING_POLICY_ID);
    expect(body.rentalMinutes).toBe(expectedMinutes);
    expect(body.billableBlocks).toBe(expectedBlocks);
    expect(body.billableHours).toBe(expectedBlocks * 0.5);
    expect(body.baseRentalAmount).toBe(expectedBaseAmount);
    expect(body.prepaidAmount).toBe(0);
    expect(body.eligibleRentalAmount).toBe(expectedBaseAmount);
    expect(body.subscriptionApplied).toBe(false);
    expect(body.subscriptionDiscountAmount).toBe(0);
    expect(body.bestDiscountRule).toEqual({
      ruleId: highTier.rule.id,
      name: "RIDE-2H",
      triggerType: "RIDING_DURATION",
      minRidingMinutes: 120,
      discountType: "FIXED_AMOUNT",
      discountValue: 2000,
    });
    expect(body.bestDiscountRule?.ruleId).not.toBe(lowTier.rule.id);
    expect(body.couponDiscountAmount).toBe(2000);
    expect(body.penaltyAmount).toBe(0);
    expect(body.depositForfeited).toBe(false);
    expect(body.payableRentalAmount).toBe(expectedBaseAmount - 2000);
    expect(body.totalPayableAmount).toBe(expectedBaseAmount - 2000);
  });

  it("does not apply a global discount rule when the rental has a subscription", async () => {
    const graph = await createRentalGraph({ withSubscription: true });
    await createDurationDiscountRule({
      code: "SUB-BLOCKED",
      minRidingMinutes: 60,
      discountValue: "6000",
    });

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${graph.rental.id}/billing-preview`,
      {
        headers: {
          Authorization: `Bearer ${graph.token}`,
        },
      },
    );

    const body = await response.json() as RentalsContracts.RentalBillingPreview;
    const expectedMinutes = getExpectedMinutes(body.previewedAt, graph.startTime);
    const expectedBlocks = getExpectedBlocks(expectedMinutes);
    const expectedBaseAmount = expectedBlocks * 2000;

    expect(response.status).toBe(200);
    expect(body.subscriptionApplied).toBe(true);
    expect(body.baseRentalAmount).toBe(expectedBaseAmount);
    expect(body.subscriptionDiscountAmount).toBe(expectedBaseAmount);
    expect(body.eligibleRentalAmount).toBe(0);
    expect(body.bestDiscountRule).toBeNull();
    expect(body.couponDiscountAmount).toBe(0);
    expect(body.payableRentalAmount).toBe(0);
    expect(body.totalPayableAmount).toBe(0);
  });

  it("subtracts prepaid before applying the global discount rule", async () => {
    const graph = await createRentalGraph({
      prepaid: "2000",
      startOffsetMs: 245 * 60 * 1000 + 5000,
    });
    const bestRule = await createDurationDiscountRule({
      code: "PREPAID-4H",
      minRidingMinutes: 240,
      discountValue: "4000",
      priority: 80,
    });

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${graph.rental.id}/billing-preview`,
      {
        headers: {
          Authorization: `Bearer ${graph.token}`,
        },
      },
    );

    const body = await response.json() as RentalsContracts.RentalBillingPreview;
    const expectedMinutes = getExpectedMinutes(body.previewedAt, graph.startTime);
    const expectedBlocks = getExpectedBlocks(expectedMinutes);
    const expectedBaseAmount = expectedBlocks * 2000;

    expect(response.status).toBe(200);
    expect(body.baseRentalAmount).toBe(expectedBaseAmount);
    expect(body.prepaidAmount).toBe(2000);
    expect(body.eligibleRentalAmount).toBe(expectedBaseAmount - 2000);
    expect(body.bestDiscountRule).toEqual({
      ruleId: bestRule.rule.id,
      name: "PREPAID-4H",
      triggerType: "RIDING_DURATION",
      minRidingMinutes: 240,
      discountType: "FIXED_AMOUNT",
      discountValue: 4000,
    });
    expect(body.couponDiscountAmount).toBe(4000);
    expect(body.payableRentalAmount).toBe(expectedBaseAmount - 2000 - 4000);
    expect(body.totalPayableAmount).toBe(expectedBaseAmount - 2000 - 4000);
  });

  it("returns null bestDiscountRule when there is no eligible global rule", async () => {
    const graph = await createRentalGraph();

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${graph.rental.id}/billing-preview`,
      {
        headers: {
          Authorization: `Bearer ${graph.token}`,
        },
      },
    );

    const body = await response.json() as RentalsContracts.RentalBillingPreview;
    const expectedMinutes = getExpectedMinutes(body.previewedAt, graph.startTime);
    const expectedBlocks = getExpectedBlocks(expectedMinutes);
    const expectedBaseAmount = expectedBlocks * 2000;

    expect(response.status).toBe(200);
    expect(body.bestDiscountRule).toBeNull();
    expect(body.couponDiscountAmount).toBe(0);
    expect(body.payableRentalAmount).toBe(expectedBaseAmount);
    expect(body.totalPayableAmount).toBe(expectedBaseAmount);
  });

  it("returns 404 when previewing another user's rental", async () => {
    const graph = await createRentalGraph();
    const otherUser = await fixture.factories.user({ role: "USER" });
    const otherToken = fixture.auth.makeAccessToken({ userId: otherUser.id, role: "USER" });

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${graph.rental.id}/billing-preview`,
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

  it("returns 401 when preview is requested without a token", async () => {
    const graph = await createRentalGraph();

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${graph.rental.id}/billing-preview`,
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 when preview is requested by a non-user role", async () => {
    const graph = await createRentalGraph();
    const admin = await fixture.factories.user({ role: "ADMIN" });
    const adminToken = fixture.auth.makeAccessToken({ userId: admin.id, role: "ADMIN" });

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${graph.rental.id}/billing-preview`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );

    expect(response.status).toBe(403);
  });

  it("returns 400 when preview is requested for a completed rental", async () => {
    const graph = await createRentalGraph({ rentalStatus: "COMPLETED" });

    const response = await fixture.app.request(
      `http://test/v1/rentals/me/${graph.rental.id}/billing-preview`,
      {
        headers: {
          Authorization: `Bearer ${graph.token}`,
        },
      },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Billing preview requires an active rental",
      details: {
        code: "BILLING_PREVIEW_REQUIRES_ACTIVE_RENTAL",
        rentalId: graph.rental.id,
        status: "COMPLETED",
      },
    });
  });
});
