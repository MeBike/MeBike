import type { CouponsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const USER_ONE_ID = "018fa100-0000-7000-8000-000000000021";
const USER_TWO_ID = "018fa100-0000-7000-8000-000000000022";
const ADMIN_USER_ID = "018fa100-0000-7000-8000-000000000023";

describe("coupons routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const {
        CouponDepsLive,
        UserDepsLive,
      } = await import("@/http/shared/providers");

      return Layer.mergeAll(
        UserDepsLive,
        CouponDepsLive,
      );
    },
    seedBase: false,
    seedData: async (_db, prisma) => {
      await prisma.user.createMany({
        data: [
          {
            id: USER_ONE_ID,
            fullName: "Coupon Owner",
            email: "coupon-owner@example.com",
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
          {
            id: USER_TWO_ID,
            fullName: "Another Rider",
            email: "another-rider@example.com",
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
          {
            id: ADMIN_USER_ID,
            fullName: "Coupon Admin",
            email: "coupon-admin@example.com",
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
        ],
      });
    },
  });

  function authHeader(userId: string, role: "USER" | "ADMIN") {
    return fixture.auth.makeAuthHeader({ userId, role });
  }

  it("returns only the current user's coupons ordered by newest assignment first", async () => {
    const rule = await fixture.prisma.couponRule.create({
      data: {
        name: "Tier 1 Riding Coupon",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 60,
        discountType: "FIXED_AMOUNT",
        discountValue: "1000",
        status: "ACTIVE",
        priority: 100,
      },
    });

    const olderCoupon = await fixture.prisma.coupon.create({
      data: {
        couponRuleId: rule.id,
        code: "OLD-USER-COUPON",
        discountType: "FIXED_AMOUNT",
        discountValue: "1000",
        expiresAt: new Date("2026-05-01T00:00:00.000Z"),
        status: "ACTIVE",
      },
    });
    const newerCoupon = await fixture.prisma.coupon.create({
      data: {
        couponRuleId: rule.id,
        code: "NEW-USER-COUPON",
        discountType: "FIXED_AMOUNT",
        discountValue: "2000",
        expiresAt: new Date("2026-06-01T00:00:00.000Z"),
        status: "ACTIVE",
      },
    });
    const otherUserCoupon = await fixture.prisma.coupon.create({
      data: {
        code: "OTHER-USER-COUPON",
        discountType: "FIXED_AMOUNT",
        discountValue: "4000",
        status: "ACTIVE",
      },
    });

    const olderAssignment = await fixture.prisma.userCoupon.create({
      data: {
        userId: USER_ONE_ID,
        couponId: olderCoupon.id,
        status: "ASSIGNED",
        assignedAt: new Date("2026-04-10T08:00:00.000Z"),
      },
    });
    const newerAssignment = await fixture.prisma.userCoupon.create({
      data: {
        userId: USER_ONE_ID,
        couponId: newerCoupon.id,
        status: "LOCKED",
        assignedAt: new Date("2026-04-15T08:00:00.000Z"),
        lockedAt: new Date("2026-04-15T09:00:00.000Z"),
        lockExpiresAt: new Date("2026-04-15T09:15:00.000Z"),
      },
    });
    await fixture.prisma.userCoupon.create({
      data: {
        userId: USER_TWO_ID,
        couponId: otherUserCoupon.id,
        status: "ASSIGNED",
        assignedAt: new Date("2026-04-16T08:00:00.000Z"),
      },
    });

    const response = await fixture.app.request("http://test/v1/coupons", {
      method: "GET",
      headers: authHeader(USER_ONE_ID, "USER"),
    });
    const body = await response.json() as CouponsContracts.ListCouponsResponse;

    expect(response.status).toBe(200);
    expect(body.pagination).toEqual({
      page: 1,
      pageSize: 50,
      total: 2,
      totalPages: 1,
    });
    expect(body.data).toHaveLength(2);
    expect(body.data.map(item => item.userCouponId)).toEqual([
      newerAssignment.id,
      olderAssignment.id,
    ]);
    expect(body.data[0]).toMatchObject({
      userCouponId: newerAssignment.id,
      couponId: newerCoupon.id,
      code: "NEW-USER-COUPON",
      status: "LOCKED",
      discountType: "FIXED_AMOUNT",
      discountValue: "2000",
      couponRuleId: rule.id,
      couponRuleName: "Tier 1 Riding Coupon",
      lockedAt: "2026-04-15T09:00:00.000Z",
      lockExpiresAt: "2026-04-15T09:15:00.000Z",
    });
    expect(body.data[1]).toMatchObject({
      userCouponId: olderAssignment.id,
      couponId: olderCoupon.id,
      code: "OLD-USER-COUPON",
      status: "ASSIGNED",
    });
  });

  it("supports filtering by status with pagination", async () => {
    const assignedCoupon = await fixture.prisma.coupon.create({
      data: {
        code: "ASSIGNED-ONLY",
        discountType: "FIXED_AMOUNT",
        discountValue: "1000",
        status: "ACTIVE",
      },
    });
    const usedCoupon = await fixture.prisma.coupon.create({
      data: {
        code: "USED-ONLY",
        discountType: "FIXED_AMOUNT",
        discountValue: "6000",
        status: "ACTIVE",
      },
    });

    await fixture.prisma.userCoupon.createMany({
      data: [
        {
          userId: USER_ONE_ID,
          couponId: assignedCoupon.id,
          status: "ASSIGNED",
          assignedAt: new Date("2026-04-10T08:00:00.000Z"),
        },
        {
          userId: USER_ONE_ID,
          couponId: usedCoupon.id,
          status: "USED",
          assignedAt: new Date("2026-04-12T08:00:00.000Z"),
          usedAt: new Date("2026-04-12T09:00:00.000Z"),
        },
      ],
    });

    const response = await fixture.app.request("http://test/v1/coupons?status=USED&page=1&pageSize=1", {
      method: "GET",
      headers: authHeader(USER_ONE_ID, "USER"),
    });
    const body = await response.json() as CouponsContracts.ListCouponsResponse;

    expect(response.status).toBe(200);
    expect(body.pagination).toEqual({
      page: 1,
      pageSize: 1,
      total: 1,
      totalPages: 1,
    });
    expect(body.data).toEqual([
      expect.objectContaining({
        code: "USED-ONLY",
        status: "USED",
        usedAt: "2026-04-12T09:00:00.000Z",
      }),
    ]);
  });

  it("returns coupon detail for the current user", async () => {
    const rule = await fixture.prisma.couponRule.create({
      data: {
        name: "Tier 2h Riding Coupon",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
        discountValue: "2000",
        status: "ACTIVE",
        priority: 90,
      },
    });
    const coupon = await fixture.prisma.coupon.create({
      data: {
        couponRuleId: rule.id,
        code: "DETAIL-COUPON",
        discountType: "FIXED_AMOUNT",
        discountValue: "2000",
        expiresAt: new Date("2026-06-30T00:00:00.000Z"),
        status: "ACTIVE",
      },
    });
    const userCoupon = await fixture.prisma.userCoupon.create({
      data: {
        userId: USER_ONE_ID,
        couponId: coupon.id,
        status: "ASSIGNED",
        assignedAt: new Date("2026-04-15T08:00:00.000Z"),
      },
    });

    const response = await fixture.app.request(`http://test/v1/coupons/${userCoupon.id}`, {
      method: "GET",
      headers: authHeader(USER_ONE_ID, "USER"),
    });
    const body = await response.json() as CouponsContracts.CouponDetailResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      userCouponId: userCoupon.id,
      couponId: coupon.id,
      couponRuleId: rule.id,
      couponRuleName: "Tier 2h Riding Coupon",
      code: "DETAIL-COUPON",
      status: "ASSIGNED",
      discountType: "FIXED_AMOUNT",
      discountValue: "2000",
      expiresAt: "2026-06-30T00:00:00.000Z",
      assignedAt: "2026-04-15T08:00:00.000Z",
      usedAt: null,
      lockedAt: null,
      lockExpiresAt: null,
      description: null,
      coupon: {
        id: coupon.id,
        code: "DETAIL-COUPON",
        discountType: "FIXED_AMOUNT",
        discountValue: "2000",
        expiresAt: "2026-06-30T00:00:00.000Z",
        rule: {
          id: rule.id,
          name: "Tier 2h Riding Coupon",
          triggerType: "RIDING_DURATION",
          minRidingMinutes: 120,
          minBillableHours: "2",
        },
      },
      conditions: {
        requiresNoSubscription: true,
        usesBillableHours: true,
        billableMinutesPerBlock: 30,
        billableHoursPerBlock: "0.5",
        minimumBillableHours: "2",
        appliesToPenalty: false,
        appliesToDepositForfeited: false,
        appliesToOtherFees: false,
        maxCouponsPerRental: 1,
      },
    });
  });

  it("returns 404 when coupon detail does not exist", async () => {
    const response = await fixture.app.request("http://test/v1/coupons/018fa100-0000-7000-8000-000000009999", {
      method: "GET",
      headers: authHeader(USER_ONE_ID, "USER"),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Coupon not found",
      details: {
        code: "COUPON_NOT_FOUND",
      },
    });
  });

  it("returns 404 when user requests another user's coupon detail", async () => {
    const coupon = await fixture.prisma.coupon.create({
      data: {
        code: "OTHER-DETAIL-COUPON",
        discountType: "FIXED_AMOUNT",
        discountValue: "1000",
        status: "ACTIVE",
      },
    });
    const otherUserCoupon = await fixture.prisma.userCoupon.create({
      data: {
        userId: USER_TWO_ID,
        couponId: coupon.id,
        status: "ASSIGNED",
      },
    });

    const response = await fixture.app.request(`http://test/v1/coupons/${otherUserCoupon.id}`, {
      method: "GET",
      headers: authHeader(USER_ONE_ID, "USER"),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Coupon not found",
      details: {
        code: "COUPON_NOT_FOUND",
      },
    });
  });

  it("returns 401 when coupon detail is requested without token", async () => {
    const response = await fixture.app.request("http://test/v1/coupons/018fa100-0000-7000-8000-000000009999", {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });

  it("forbids non-user roles from getting coupon detail", async () => {
    const response = await fixture.app.request("http://test/v1/coupons/018fa100-0000-7000-8000-000000009999", {
      method: "GET",
      headers: authHeader(ADMIN_USER_ID, "ADMIN"),
    });

    expect(response.status).toBe(403);
  });

  it("forbids non-user roles from listing coupons", async () => {
    const response = await fixture.app.request("http://test/v1/coupons", {
      method: "GET",
      headers: authHeader(ADMIN_USER_ID, "ADMIN"),
    });

    expect(response.status).toBe(403);
  });
});
