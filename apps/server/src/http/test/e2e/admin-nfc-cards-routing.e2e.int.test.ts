import type { NfcCardsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "019d1c26-9d34-7f97-ae3c-4c3f0c2d2201";
const VERIFIED_USER_ID = "019d1c26-9d34-7f97-ae3c-4c3f0c2d2202";
const UNVERIFIED_USER_ID = "019d1c26-9d34-7f97-ae3c-4c3f0c2d2203";
const BANNED_USER_ID = "019d1c26-9d34-7f97-ae3c-4c3f0c2d2204";

describe("admin NFC cards routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { NfcCardDepsLive } = await import("@/http/shared/features/nfc-card.layers");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(
        NfcCardDepsLive,
        UserDepsLive,
      );
    },
    seedData: async (_db, prisma) => {
      await prisma.user.createMany({
        data: [
          {
            id: ADMIN_USER_ID,
            fullName: "NFC Admin",
            email: "nfc-admin@example.com",
            passwordHash: "hash123",
            phoneNumber: null,
            username: null,
            avatarUrl: null,
            locationText: null,
            role: "ADMIN",
            accountStatus: "ACTIVE",
            verifyStatus: "VERIFIED",
          },
          {
            id: VERIFIED_USER_ID,
            fullName: "Verified User",
            email: "verified-user@example.com",
            passwordHash: "hash123",
            phoneNumber: null,
            username: null,
            avatarUrl: null,
            locationText: null,
            role: "USER",
            accountStatus: "ACTIVE",
            verifyStatus: "VERIFIED",
          },
          {
            id: UNVERIFIED_USER_ID,
            fullName: "Unverified User",
            email: "unverified-user@example.com",
            passwordHash: "hash123",
            phoneNumber: null,
            username: null,
            avatarUrl: null,
            locationText: null,
            role: "USER",
            accountStatus: "ACTIVE",
            verifyStatus: "UNVERIFIED",
          },
          {
            id: BANNED_USER_ID,
            fullName: "Banned User",
            email: "banned-user@example.com",
            passwordHash: "hash123",
            phoneNumber: null,
            username: null,
            avatarUrl: null,
            locationText: null,
            role: "USER",
            accountStatus: "BANNED",
            verifyStatus: "VERIFIED",
          },
        ],
      });
    },
  });

  function authHeaders() {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });

    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  it("creates and assigns an NFC card to a verified active user", async () => {
    const createResponse = await fixture.app.request("http://test/v1/admin/nfc-cards", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ uid: "123456789" }),
    });
    const created = await createResponse.json() as NfcCardsContracts.NfcCard;

    expect(createResponse.status).toBe(201);
    expect(created.status).toBe("UNASSIGNED");

    const assignResponse = await fixture.app.request(`http://test/v1/admin/nfc-cards/${created.id}/assign`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ userId: VERIFIED_USER_ID }),
    });
    const assigned = await assignResponse.json() as NfcCardsContracts.NfcCard;

    expect(assignResponse.status).toBe(200);
    expect(assigned.status).toBe("ACTIVE");
    expect(assigned.assigned_user_id).toBe(VERIFIED_USER_ID);
    expect(assigned.assigned_user?.verify_status).toBe("VERIFIED");
  });

  it("rejects assigning a card to an unverified user", async () => {
    const card = await fixture.prisma.nfcCard.create({
      data: {
        id: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
        uid: "22334455",
      },
    });

    const response = await fixture.app.request(`http://test/v1/admin/nfc-cards/${card.id}/assign`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ userId: UNVERIFIED_USER_ID }),
    });
    const body = await response.json() as NfcCardsContracts.NfcCardErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details.code).toBe("NFC_CARD_USER_NOT_ELIGIBLE");
    expect(body.details.reason).toBe("UNVERIFIED");
  });

  it("blocks a card and lists it by blocked status filter", async () => {
    const card = await fixture.prisma.nfcCard.create({
      data: {
        id: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2211",
        uid: "66778899",
        status: "ACTIVE",
        assignedUserId: VERIFIED_USER_ID,
        issuedAt: new Date("2026-05-02T12:00:00.000Z"),
      },
    });

    const updateResponse = await fixture.app.request(`http://test/v1/admin/nfc-cards/${card.id}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "BLOCKED" }),
    });
    const updated = await updateResponse.json() as NfcCardsContracts.NfcCard;

    expect(updateResponse.status).toBe(200);
    expect(updated.status).toBe("BLOCKED");
    expect(updated.blocked_at).not.toBeNull();

    const listResponse = await fixture.app.request("http://test/v1/admin/nfc-cards?status=BLOCKED&page=1&pageSize=10", {
      method: "GET",
      headers: authHeaders(),
    });
    const listBody = await listResponse.json() as NfcCardsContracts.NfcCardListResponse;

    expect(listResponse.status).toBe(200);
    expect(listBody.data.some(entry => entry.id === card.id && entry.status === "BLOCKED")).toBe(true);
    expect(listBody.pagination).toMatchObject({
      page: 1,
      pageSize: 10,
    });
  });

  it("paginates NFC card list responses", async () => {
    await fixture.prisma.nfcCard.createMany({
      data: [
        { id: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2213", uid: "10000001" },
        { id: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2214", uid: "10000002" },
        { id: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2215", uid: "10000003" },
      ],
    });

    const response = await fixture.app.request("http://test/v1/admin/nfc-cards?page=2&pageSize=2", {
      method: "GET",
      headers: authHeaders(),
    });
    const body = await response.json() as NfcCardsContracts.NfcCardListResponse;

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toEqual({
      page: 2,
      pageSize: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it("unassigns a card back to inventory", async () => {
    const card = await fixture.prisma.nfcCard.create({
      data: {
        id: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2212",
        uid: "99887766",
        status: "ACTIVE",
        assignedUserId: VERIFIED_USER_ID,
        issuedAt: new Date("2026-05-02T12:00:00.000Z"),
      },
    });

    const response = await fixture.app.request(`http://test/v1/admin/nfc-cards/${card.id}/unassign`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    const body = await response.json() as NfcCardsContracts.NfcCard;

    expect(response.status).toBe(200);
    expect(body.status).toBe("UNASSIGNED");
    expect(body.assigned_user_id).toBeNull();
    expect(body.returned_at).not.toBeNull();
  });
});
