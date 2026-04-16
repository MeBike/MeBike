import type {
  CouponsContracts,
  ServerErrorResponse,
} from "@mebike/shared";

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
        CouponCommandRepositoryLive,
        CouponCommandServiceLive,
        CouponQueryRepositoryLive,
        CouponQueryServiceLive,
      } = await import("@/domain/coupons");
      const {
        UserQueryRepositoryLive,
        UserQueryServiceLive,
      } = await import("@/domain/users");

      const couponCommandRepoLayer = CouponCommandRepositoryLive.pipe(
        Layer.provide(PrismaLive),
      );
      const couponCommandLayer = CouponCommandServiceLive.pipe(
        Layer.provide(couponCommandRepoLayer),
      );
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
        couponCommandRepoLayer,
        couponCommandLayer,
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

  function jsonAuthHeader(userId: string, role: "ADMIN" | "USER") {
    return {
      ...authHeader(userId, role),
      "Content-Type": "application/json",
    };
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

  it("admin can create a global coupon rule and defaults status to INACTIVE", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-rules", {
      method: "POST",
      headers: jsonAuthHeader(ADMIN_USER_ID, "ADMIN"),
      body: JSON.stringify({
        name: "Ride 2h discount",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
        discountValue: 2000,
        priority: 100,
        activeFrom: null,
        activeTo: null,
      }),
    });
    const body = await response.json() as CouponsContracts.AdminCouponRule;

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      name: "Ride 2h discount",
      triggerType: "RIDING_DURATION",
      minRidingMinutes: 120,
      minBillableHours: 2,
      discountType: "FIXED_AMOUNT",
      discountValue: 2000,
      status: "INACTIVE",
      priority: 100,
      activeFrom: null,
      activeTo: null,
    });
    expect(typeof body.id).toBe("string");
    expect(typeof body.createdAt).toBe("string");
    expect(typeof body.updatedAt).toBe("string");

    const created = await fixture.prisma.couponRule.findUnique({
      where: { id: body.id },
    });
    expect(created).not.toBeNull();
    expect(created).toMatchObject({
      name: "Ride 2h discount",
      triggerType: "RIDING_DURATION",
      minRidingMinutes: 120,
      minCompletedRentals: null,
      discountType: "FIXED_AMOUNT",
      discountValue: expect.anything(),
      status: "INACTIVE",
      priority: 100,
      activeFrom: null,
      activeTo: null,
    });
    expect(created?.discountValue.toString()).toBe("2000");
    expect(await fixture.prisma.coupon.count()).toBe(0);
    expect(await fixture.prisma.userCoupon.count()).toBe(0);
  });

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

  it("admin can update an existing global coupon rule and updatedAt changes", async () => {
    const existing = await createRule({
      name: "Ride 2h discount",
      createdAt: "2026-04-17T00:00:00.000Z",
      updatedAt: "2026-04-17T00:00:00.000Z",
      minRidingMinutes: 120,
      discountValue: "2000",
      status: "ACTIVE",
      priority: 100,
    });

    const response = await fixture.app.request(`http://test/v1/admin/coupon-rules/${existing.id}`, {
      method: "PUT",
      headers: jsonAuthHeader(ADMIN_USER_ID, "ADMIN"),
      body: JSON.stringify({
        name: "Ride 2h discount updated",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
        discountValue: 2500,
        priority: 90,
        status: "INACTIVE",
        activeFrom: null,
        activeTo: null,
      }),
    });
    const body = await response.json() as CouponsContracts.AdminCouponRule;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: existing.id,
      name: "Ride 2h discount updated",
      triggerType: "RIDING_DURATION",
      minRidingMinutes: 120,
      minBillableHours: 2,
      discountType: "FIXED_AMOUNT",
      discountValue: 2500,
      status: "INACTIVE",
      priority: 90,
      activeFrom: null,
      activeTo: null,
      createdAt: "2026-04-17T00:00:00.000Z",
    });
    expect(body.updatedAt).not.toBe("2026-04-17T00:00:00.000Z");

    const updated = await fixture.prisma.couponRule.findUnique({
      where: { id: existing.id },
    });
    expect(updated).not.toBeNull();
    expect(updated).toMatchObject({
      id: existing.id,
      name: "Ride 2h discount updated",
      triggerType: "RIDING_DURATION",
      minRidingMinutes: 120,
      minCompletedRentals: null,
      discountType: "FIXED_AMOUNT",
      status: "INACTIVE",
      priority: 90,
      activeFrom: null,
      activeTo: null,
    });
    expect(updated?.discountValue.toString()).toBe("2500");
    expect(updated?.updatedAt.toISOString()).not.toBe("2026-04-17T00:00:00.000Z");
    expect(await fixture.prisma.coupon.count()).toBe(0);
    expect(await fixture.prisma.userCoupon.count()).toBe(0);
  });

  it("returns 401 when token is missing", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-rules");

    expect(response.status).toBe(401);
  });

  it("returns 401 when creating without token", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-rules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Ride 2h discount",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
        discountValue: 2000,
      }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 401 when updating without token", async () => {
    const existing = await createRule({
      name: "Ride 2h discount",
      createdAt: "2026-04-17T00:00:00.000Z",
      minRidingMinutes: 120,
      discountValue: "2000",
    });

    const response = await fixture.app.request(`http://test/v1/admin/coupon-rules/${existing.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Ride 2h discount updated",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
        discountValue: 2500,
        priority: 90,
        status: "INACTIVE",
        activeFrom: null,
        activeTo: null,
      }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 403 when authenticated user is not admin", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-rules", {
      method: "GET",
      headers: authHeader(USER_USER_ID, "USER"),
    });

    expect(response.status).toBe(403);
  });

  it("returns 403 when authenticated user is not admin for create", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-rules", {
      method: "POST",
      headers: jsonAuthHeader(USER_USER_ID, "USER"),
      body: JSON.stringify({
        name: "Ride 2h discount",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
        discountValue: 2000,
      }),
    });

    expect(response.status).toBe(403);
  });

  it("returns 403 when authenticated user is not admin for update", async () => {
    const existing = await createRule({
      name: "Ride 2h discount",
      createdAt: "2026-04-17T00:00:00.000Z",
      minRidingMinutes: 120,
      discountValue: "2000",
    });

    const response = await fixture.app.request(`http://test/v1/admin/coupon-rules/${existing.id}`, {
      method: "PUT",
      headers: jsonAuthHeader(USER_USER_ID, "USER"),
      body: JSON.stringify({
        name: "Ride 2h discount updated",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
        discountValue: 2500,
        priority: 90,
        status: "INACTIVE",
        activeFrom: null,
        activeTo: null,
      }),
    });

    expect(response.status).toBe(403);
  });

  it("returns 404 when updating a missing coupon rule", async () => {
    const missingRuleId = "019b17bd-d130-7e7d-be69-91ceef7b7299";

    const response = await fixture.app.request(`http://test/v1/admin/coupon-rules/${missingRuleId}`, {
      method: "PUT",
      headers: jsonAuthHeader(ADMIN_USER_ID, "ADMIN"),
      body: JSON.stringify({
        name: "Ride 2h discount updated",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
        discountValue: 2500,
        priority: 90,
        status: "INACTIVE",
        activeFrom: null,
        activeTo: null,
      }),
    });
    const body = await response.json() as CouponsContracts.CouponRuleErrorResponse;

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Coupon rule not found",
      details: {
        code: "COUPON_RULE_NOT_FOUND",
        ruleId: missingRuleId,
      },
    });
  });

  it("returns validation error when discountValue is not positive", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-rules", {
      method: "POST",
      headers: jsonAuthHeader(ADMIN_USER_ID, "ADMIN"),
      body: JSON.stringify({
        name: "Ride 2h discount",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
        discountValue: 0,
      }),
    });
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
  });

  it("returns validation error when update discountValue is not positive", async () => {
    const existing = await createRule({
      name: "Ride 2h discount",
      createdAt: "2026-04-17T00:00:00.000Z",
      minRidingMinutes: 120,
      discountValue: "2000",
    });

    const response = await fixture.app.request(`http://test/v1/admin/coupon-rules/${existing.id}`, {
      method: "PUT",
      headers: jsonAuthHeader(ADMIN_USER_ID, "ADMIN"),
      body: JSON.stringify({
        name: "Ride 2h discount updated",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
        discountValue: 0,
        priority: 90,
        status: "INACTIVE",
        activeFrom: null,
        activeTo: null,
      }),
    });
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
  });

  it("returns validation error when minRidingMinutes is not positive", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-rules", {
      method: "POST",
      headers: jsonAuthHeader(ADMIN_USER_ID, "ADMIN"),
      body: JSON.stringify({
        name: "Ride 2h discount",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 0,
        discountType: "FIXED_AMOUNT",
        discountValue: 2000,
      }),
    });
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
  });

  it("returns validation error when update minRidingMinutes is not positive", async () => {
    const existing = await createRule({
      name: "Ride 2h discount",
      createdAt: "2026-04-17T00:00:00.000Z",
      minRidingMinutes: 120,
      discountValue: "2000",
    });

    const response = await fixture.app.request(`http://test/v1/admin/coupon-rules/${existing.id}`, {
      method: "PUT",
      headers: jsonAuthHeader(ADMIN_USER_ID, "ADMIN"),
      body: JSON.stringify({
        name: "Ride 2h discount updated",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 0,
        discountType: "FIXED_AMOUNT",
        discountValue: 2500,
        priority: 90,
        status: "INACTIVE",
        activeFrom: null,
        activeTo: null,
      }),
    });
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
  });

  it("returns validation error when activeFrom is after activeTo", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-rules", {
      method: "POST",
      headers: jsonAuthHeader(ADMIN_USER_ID, "ADMIN"),
      body: JSON.stringify({
        name: "Ride 2h discount",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
        discountValue: 2000,
        activeFrom: "2026-04-18T00:00:00.000Z",
        activeTo: "2026-04-17T00:00:00.000Z",
      }),
    });
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
  });

  it("returns validation error when update activeFrom is after activeTo", async () => {
    const existing = await createRule({
      name: "Ride 2h discount",
      createdAt: "2026-04-17T00:00:00.000Z",
      minRidingMinutes: 120,
      discountValue: "2000",
    });

    const response = await fixture.app.request(`http://test/v1/admin/coupon-rules/${existing.id}`, {
      method: "PUT",
      headers: jsonAuthHeader(ADMIN_USER_ID, "ADMIN"),
      body: JSON.stringify({
        name: "Ride 2h discount updated",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
        discountValue: 2500,
        priority: 90,
        status: "INACTIVE",
        activeFrom: "2026-04-18T00:00:00.000Z",
        activeTo: "2026-04-17T00:00:00.000Z",
      }),
    });
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
  });

  it("returns validation error when required fields are missing", async () => {
    const response = await fixture.app.request("http://test/v1/admin/coupon-rules", {
      method: "POST",
      headers: jsonAuthHeader(ADMIN_USER_ID, "ADMIN"),
      body: JSON.stringify({
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
      }),
    });
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
  });

  it("returns validation error when update body is missing required fields", async () => {
    const existing = await createRule({
      name: "Ride 2h discount",
      createdAt: "2026-04-17T00:00:00.000Z",
      minRidingMinutes: 120,
      discountValue: "2000",
    });

    const response = await fixture.app.request(`http://test/v1/admin/coupon-rules/${existing.id}`, {
      method: "PUT",
      headers: jsonAuthHeader(ADMIN_USER_ID, "ADMIN"),
      body: JSON.stringify({
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        discountType: "FIXED_AMOUNT",
        discountValue: 2500,
      }),
    });
    const body = await response.json() as ServerErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
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
