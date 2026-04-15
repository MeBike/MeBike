import type { SubscriptionsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018fa100-0000-7000-8000-000000000001";
const USER_ONE_ID = "018fa100-0000-7000-8000-000000000002";
const USER_TWO_ID = "018fa100-0000-7000-8000-000000000003";

describe("admin subscriptions routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { SubscriptionDepsLive } = await import("@/http/shared/features/subscription.layers");
      return SubscriptionDepsLive;
    },
    seedBase: false,
    seedData: async (_db, prisma) => {
      await prisma.user.createMany({
        data: [
          {
            id: ADMIN_USER_ID,
            fullName: "Admin Viewer",
            email: "admin-viewer@example.com",
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
            id: USER_ONE_ID,
            fullName: "Alice Rider",
            email: "alice@example.com",
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
            fullName: "Bob Rider",
            email: "bob@example.com",
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

  it("admin can list subscriptions across all users with owner info", async () => {
    const first = await fixture.prisma.subscription.create({
      data: {
        userId: USER_ONE_ID,
        packageName: "premium",
        maxUsages: 20,
        usageCount: 4,
        status: "ACTIVE",
        activatedAt: new Date("2026-04-15T00:00:00.000Z"),
        expiresAt: new Date("2026-05-15T00:00:00.000Z"),
        price: BigInt(1990),
      },
    });
    const second = await fixture.prisma.subscription.create({
      data: {
        userId: USER_TWO_ID,
        packageName: "basic",
        maxUsages: 10,
        usageCount: 0,
        status: "PENDING",
        price: BigInt(990),
      },
    });

    const response = await fixture.app.request("http://test/v1/admin/subscriptions", {
      method: "GET",
      headers: authHeader(ADMIN_USER_ID, "ADMIN"),
    });
    const body = await response.json() as SubscriptionsContracts.AdminListSubscriptionsResponse;

    expect(response.status).toBe(200);
    expect(body.pagination.total).toBe(2);
    expect(body.data).toHaveLength(2);
    expect(body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: first.id,
        userId: USER_ONE_ID,
        packageName: "premium",
        user: {
          id: USER_ONE_ID,
          fullName: "Alice Rider",
          email: "alice@example.com",
        },
      }),
      expect.objectContaining({
        id: second.id,
        userId: USER_TWO_ID,
        packageName: "basic",
        user: {
          id: USER_TWO_ID,
          fullName: "Bob Rider",
          email: "bob@example.com",
        },
      }),
    ]));
  });

  it("admin can read subscription detail with owner info", async () => {
    const subscription = await fixture.prisma.subscription.create({
      data: {
        userId: USER_ONE_ID,
        packageName: "unlimited",
        maxUsages: null,
        usageCount: 1,
        status: "ACTIVE",
        activatedAt: new Date("2026-04-10T00:00:00.000Z"),
        expiresAt: new Date("2026-05-10T00:00:00.000Z"),
        price: BigInt(2990),
      },
    });

    const response = await fixture.app.request(`http://test/v1/admin/subscriptions/${subscription.id}`, {
      method: "GET",
      headers: authHeader(ADMIN_USER_ID, "ADMIN"),
    });
    const body = await response.json() as SubscriptionsContracts.AdminSubscriptionDetailResponse;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: subscription.id,
      userId: USER_ONE_ID,
      packageName: "unlimited",
      user: {
        id: USER_ONE_ID,
        fullName: "Alice Rider",
        email: "alice@example.com",
      },
    });
  });

  it("blocks non-admin from admin subscription list", async () => {
    const response = await fixture.app.request("http://test/v1/admin/subscriptions", {
      method: "GET",
      headers: authHeader(USER_ONE_ID, "USER"),
    });

    expect(response.status).toBe(403);
  });
});
