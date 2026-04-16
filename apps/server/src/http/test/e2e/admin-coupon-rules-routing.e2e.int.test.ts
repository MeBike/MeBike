import type { CouponsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018fa100-0000-7000-8000-00000000c001";
const USER_USER_ID = "018fa100-0000-7000-8000-00000000c002";

describe("admin coupon rules routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const {
        CouponQueryRepositoryLive,
        CouponQueryServiceLive,
      } = await import("@/domain/coupons");
      const {
        UserQueryRepositoryLive,
        UserQueryServiceLive,
      } = await import("@/domain/users");

      const couponQueryRepoLayer = CouponQueryRepositoryLive.pipe(
        Layer.provide(PrismaLive),
      );
      const couponQueryLayer = CouponQueryServiceLive.pipe(
        Layer.provide(couponQueryRepoLayer),
      );
      const userQueryRepoLayer = UserQueryRepositoryLive.pipe(
        Layer.provide(PrismaLive),
      );
      const userQueryLayer = UserQueryServiceLive.pipe(
        Layer.provide(userQueryRepoLayer),
      );

      return Layer.mergeAll(
        PrismaLive,
        couponQueryRepoLayer,
        couponQueryLayer,
        userQueryRepoLayer,
        userQueryLayer,
      );
    },
    seedBase: false,
    seedData: async (_db, prisma) => {
      await prisma.user.createMany({
        data: [
          {
            id: ADMIN_USER_ID,
            fullName: "Admin Coupon Viewer",
            email: "admin-coupon-viewer@example.com",
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
            fullName: "Coupon User",
            email: "coupon-user@example.com",
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

  async function createRule(input: {
    readonly name: string;
    readonly createdAt: string;
    readonly updatedAt?: string;
    readonly minRidingMinutes?: number | null;
    readonly discountValue: string;
    readonly status?: "ACTIVE" | "INACTIVE";
    readonly priority?: number;
    readonly triggerType?: "RIDING_DURATION" | "CAMPAIGN";
    readonly discountType?: "FIXED_AMOUNT" | "PERCENTAGE";
    readonly activeFrom?: Date | null;
    readonly activeTo?: Date | null;
  }) {
    return fixture.prisma.couponRule.create({
      data: {
        name: input.name,
        triggerType: input.triggerType ?? "RIDING_DURATION",
        minRidingMinutes: input.minRidingMinutes ?? null,
        discountType: input.discountType ?? "FIXED_AMOUNT",
        discountValue: input.discountValue,
        status: input.status ?? "ACTIVE",
        priority: input.priority ?? 100,
        activeFrom: input.activeFrom ?? null,
        activeTo: input.activeTo ?? null,
        createdAt: new Date(input.createdAt),
        updatedAt: new Date(input.updatedAt ?? input.createdAt),
      },
    });
  }

  it("admin can list all coupon rules with pagination metadata", async () => {
    const newest = await createRule({
      name: "Ride 6h discount",
      createdAt: "2026-04-17T06:00:00.000Z",
      minRidingMinutes: 360,
      discountValue: "6000",
      status: "ACTIVE",
    });
    await createRule({
      name: "Ride 4h discount",
      createdAt: "2026-04-17T05:00:00.000Z",
      minRidingMinutes: 240,
      discountValue: "4000",
      status: "INACTIVE",
    });

    const response = await fixture.app.request("http://test/v1/admin/coupon-rules", {
      method: "GET",
      headers: authHeader(ADMIN_USER_ID, "ADMIN"),
    });
    const body = await response.json() as CouponsContracts.AdminCouponRulesListResponse;

    expect(response.status).toBe(200);
    expect(body.pagination).toEqual({
      page: 1,
      pageSize: 20,
      total: 2,
      totalPages: 1,
    });
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({
      id: newest.id,
      name: "Ride 6h discount",
      triggerType: "RIDING_DURATION",
      minRidingMinutes: 360,
      minBillableHours: 6,
      discountType: "FIXED_AMOUNT",
      discountValue: 6000,
      status: "ACTIVE",
      priority: 100,
      activeFrom: null,
      activeTo: null,
      createdAt: "2026-04-17T06:00:00.000Z",
      updatedAt: "2026-04-17T06:00:00.000Z",
    });
    expect(body.data.map(rule => rule.name)).toEqual([
      "Ride 6h discount",
      "Ride 4h discount",
    ]);
  });

  it("returns 401 when token is missing", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-rules");

    expect(response.status).toBe(401);
  });

  it("returns 403 when authenticated user is not admin", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-rules", {
      method: "GET",
      headers: authHeader(USER_USER_ID, "USER"),
    });

    expect(response.status).toBe(403);
  });

  it("filters by ACTIVE status", async () => {
    await createRule({
      name: "Active rule",
      createdAt: "2026-04-17T02:00:00.000Z",
      minRidingMinutes: 120,
      discountValue: "2000",
      status: "ACTIVE",
    });
    await createRule({
      name: "Inactive rule",
      createdAt: "2026-04-17T01:00:00.000Z",
      minRidingMinutes: 60,
      discountValue: "1000",
      status: "INACTIVE",
    });

    const response = await fixture.app.request(
      "http://test/v1/admin/coupon-rules?status=ACTIVE",
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const body = await response.json() as CouponsContracts.AdminCouponRulesListResponse;

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.name).toBe("Active rule");
    expect(body.data[0]?.status).toBe("ACTIVE");
  });

  it("filters by INACTIVE status", async () => {
    await createRule({
      name: "Active rule",
      createdAt: "2026-04-17T02:00:00.000Z",
      minRidingMinutes: 120,
      discountValue: "2000",
      status: "ACTIVE",
    });
    await createRule({
      name: "Inactive rule",
      createdAt: "2026-04-17T01:00:00.000Z",
      minRidingMinutes: 60,
      discountValue: "1000",
      status: "INACTIVE",
    });

    const response = await fixture.app.request(
      "http://test/v1/admin/coupon-rules?status=INACTIVE",
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const body = await response.json() as CouponsContracts.AdminCouponRulesListResponse;

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.name).toBe("Inactive rule");
    expect(body.data[0]?.status).toBe("INACTIVE");
  });

  it("returns empty data when no coupon rule matches", async () => {
    const response = await fixture.app.request(
      "http://test/v1/admin/coupon-rules?status=ACTIVE",
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const body = await response.json() as CouponsContracts.AdminCouponRulesListResponse;

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

  it("applies pagination with createdAt desc ordering", async () => {
    await createRule({
      name: "Rule 1",
      createdAt: "2026-04-17T01:00:00.000Z",
      minRidingMinutes: 60,
      discountValue: "1000",
    });
    await createRule({
      name: "Rule 2",
      createdAt: "2026-04-17T02:00:00.000Z",
      minRidingMinutes: 120,
      discountValue: "2000",
    });
    await createRule({
      name: "Rule 3",
      createdAt: "2026-04-17T03:00:00.000Z",
      minRidingMinutes: 240,
      discountValue: "4000",
    });
    await createRule({
      name: "Rule 4",
      createdAt: "2026-04-17T04:00:00.000Z",
      minRidingMinutes: 360,
      discountValue: "6000",
    });

    const response = await fixture.app.request(
      "http://test/v1/admin/coupon-rules?page=2&pageSize=2",
      {
        method: "GET",
        headers: authHeader(ADMIN_USER_ID, "ADMIN"),
      },
    );
    const body = await response.json() as CouponsContracts.AdminCouponRulesListResponse;

    expect(response.status).toBe(200);
    expect(body.pagination).toEqual({
      page: 2,
      pageSize: 2,
      total: 4,
      totalPages: 2,
    });
    expect(body.data.map(rule => rule.name)).toEqual([
      "Rule 2",
      "Rule 1",
    ]);
  });
});
