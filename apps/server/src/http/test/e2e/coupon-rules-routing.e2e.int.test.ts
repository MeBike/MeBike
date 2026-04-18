import type { CouponsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("coupon rules routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { CouponDepsLive } = await import("@/http/shared/providers");
      return CouponDepsLive;
    },
  });

  async function createRule(input: {
    readonly name: string;
    readonly minRidingMinutes: number | null;
    readonly discountValue: string;
    readonly status?: "ACTIVE" | "INACTIVE";
    readonly priority?: number;
    readonly activeFrom?: Date | null;
    readonly activeTo?: Date | null;
    readonly triggerType?: "RIDING_DURATION" | "CAMPAIGN";
    readonly discountType?: "FIXED_AMOUNT" | "PERCENTAGE";
  }) {
    return fixture.prisma.couponRule.create({
      data: {
        name: input.name,
        triggerType: input.triggerType ?? "RIDING_DURATION",
        minRidingMinutes: input.minRidingMinutes,
        discountType: input.discountType ?? "FIXED_AMOUNT",
        discountValue: input.discountValue,
        status: input.status ?? "ACTIVE",
        priority: input.priority ?? 100,
        activeFrom: input.activeFrom,
        activeTo: input.activeTo,
      },
    });
  }

  it("lists only active global fixed riding duration rules in display order", async () => {
    const now = Date.now();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now + 24 * 60 * 60 * 1000);

    await createRule({
      name: "Ride 2h discount",
      minRidingMinutes: 120,
      discountValue: "2000",
    });
    await createRule({
      name: "Ride 1h discount",
      minRidingMinutes: 60,
      discountValue: "1000",
    });
    await createRule({
      name: "Ride 6h discount",
      minRidingMinutes: 360,
      discountValue: "6000",
    });
    await createRule({
      name: "Ride 4h discount",
      minRidingMinutes: 240,
      discountValue: "4000",
    });
    await createRule({
      name: "Inactive discount",
      minRidingMinutes: 30,
      discountValue: "500",
      status: "INACTIVE",
    });
    await createRule({
      name: "Future discount",
      minRidingMinutes: 45,
      discountValue: "700",
      activeFrom: tomorrow,
    });
    await createRule({
      name: "Expired discount",
      minRidingMinutes: 50,
      discountValue: "800",
      activeTo: yesterday,
    });
    await createRule({
      name: "Campaign discount",
      minRidingMinutes: 55,
      discountValue: "900",
      triggerType: "CAMPAIGN",
    });
    await createRule({
      name: "Percentage discount",
      minRidingMinutes: 65,
      discountValue: "10",
      discountType: "PERCENTAGE",
    });

    const response = await fixture.app.request(
      "http://test/v1/coupon-rules/active",
    );

    const body = await response.json() as CouponsContracts.ActiveCouponRulesResponse;

    expect(response.status).toBe(200);
    expect(body.data.map(rule => rule.minRidingMinutes)).toEqual([
      60,
      120,
      240,
      360,
    ]);
    expect(body.data.map(rule => rule.discountValue)).toEqual([
      1000,
      2000,
      4000,
      6000,
    ]);
    expect(body.data.map(rule => rule.name)).toEqual([
      "Ride 1h discount",
      "Ride 2h discount",
      "Ride 4h discount",
      "Ride 6h discount",
    ]);
    const expectedFirstLabel = [
      "\u0110i t\u1EEB 1h",
      "\u0111\u1EBFn d\u01B0\u1EDBi 2h",
      "gi\u1EA3m 1.000 VN\u0110",
    ].join(" ");

    expect(body.data[0]).toMatchObject({
      triggerType: "RIDING_DURATION",
      minBillableHours: 1,
      discountType: "FIXED_AMOUNT",
      status: "ACTIVE",
      priority: 100,
      activeFrom: null,
      activeTo: null,
      displayLabel: expectedFirstLabel,
    });
    expect(body.data[3]?.displayLabel).toBe(
      "\u0110i t\u1EEB 6h gi\u1EA3m 6.000 VN\u0110",
    );
  });

  it("returns an empty data array when there is no active global fixed riding duration rule", async () => {
    await createRule({
      name: "Inactive discount",
      minRidingMinutes: 60,
      discountValue: "1000",
      status: "INACTIVE",
    });

    const response = await fixture.app.request(
      "http://test/v1/coupon-rules/active",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [] });
  });
});
