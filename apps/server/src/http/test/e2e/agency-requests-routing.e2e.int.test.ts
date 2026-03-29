import type { AgencyRequestsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22311";

describe("agency requests routing", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { AgencyRequestRepositoryLive } = await import("@/domain/agency-requests/repository/agency-request.repository");
      const { AgencyRequestServiceLive } = await import("@/domain/agency-requests/services/agency-request.service");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      const agencyRequestRepoLayer = AgencyRequestRepositoryLive.pipe(Layer.provide(PrismaLive));
      const agencyRequestServiceLayer = AgencyRequestServiceLive.pipe(Layer.provide(agencyRequestRepoLayer));

      return Layer.mergeAll(
        UserDepsLive,
        agencyRequestRepoLayer,
        agencyRequestServiceLayer,
        PrismaLive,
      );
    },
    seedData: async (_db, prisma) => {
      await prisma.user.create({
        data: {
          id: ADMIN_USER_ID,
          fullName: "Agency Admin",
          email: "agency-admin@example.com",
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
      });
    },
  });

  async function submitAgencyRequest(
    body: Record<string, unknown>,
    init?: { token?: string },
  ) {
    return fixture.app.request("http://test/v1/agency-requests", {
      method: "POST",
      headers: {
        ...(init?.token ? { Authorization: `Bearer ${init.token}` } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  async function listAgencyRequests(
    query = "",
    init?: { token?: string },
  ) {
    return fixture.app.request(`http://test/v1/admin/agency-requests${query}`, {
      method: "GET",
      headers: init?.token
        ? { Authorization: `Bearer ${init.token}` }
        : undefined,
    });
  }

  async function getAgencyRequestById(
    agencyRequestId: string,
    init?: { token?: string },
  ) {
    return fixture.app.request(`http://test/v1/admin/agency-requests/${agencyRequestId}`, {
      method: "GET",
      headers: init?.token
        ? { Authorization: `Bearer ${init.token}` }
        : undefined,
    });
  }

  async function cancelAgencyRequest(
    agencyRequestId: string,
    init?: { token?: string },
  ) {
    return fixture.app.request(`http://test/v1/agency-requests/${agencyRequestId}/cancel`, {
      method: "POST",
      headers: init?.token
        ? { Authorization: `Bearer ${init.token}` }
        : undefined,
    });
  }

  it("submits an agency request without authentication", async () => {
    const response = await submitAgencyRequest({
      requesterEmail: "guest-agency@example.com",
      requesterPhone: "0912345678",
      agencyName: "Guest Agency Request",
      agencyAddress: "1 Guest Street",
      agencyContactPhone: "0987654321",
      description: "Guest request description",
    });

    const body = await response.json() as AgencyRequestsContracts.SubmitAgencyRequestResponse;

    expect(response.status).toBe(201);
    expect(body.requesterUserId).toBeNull();
    expect(body.requesterEmail).toBe("guest-agency@example.com");
    expect(body.status).toBe("PENDING");

    const saved = await fixture.prisma.agencyRequest.findUnique({
      where: { id: body.id },
      select: {
        requesterUserId: true,
        requesterEmail: true,
        agencyName: true,
        status: true,
      },
    });

    expect(saved).not.toBeNull();
    expect(saved?.requesterUserId).toBeNull();
    expect(saved?.agencyName).toBe("Guest Agency Request");
    expect(saved?.status).toBe("PENDING");
  });

  it("captures requester user id when an authenticated user submits the request", async () => {
    const requester = await fixture.factories.user({
      email: "agency-request-user@example.com",
      role: "USER",
    });

    const token = fixture.auth.makeAccessToken({ userId: requester.id, role: "USER" });

    const response = await submitAgencyRequest({
      requesterEmail: "user-agency@example.com",
      requesterPhone: "0911111111",
      agencyName: "User Agency Request",
    }, { token });

    const body = await response.json() as AgencyRequestsContracts.SubmitAgencyRequestResponse;

    expect(response.status).toBe(201);
    expect(body.requesterUserId).toBe(requester.id);
    expect(body.status).toBe("PENDING");

    const saved = await fixture.prisma.agencyRequest.findUnique({
      where: { id: body.id },
      select: { requesterUserId: true },
    });

    expect(saved?.requesterUserId).toBe(requester.id);
  });

  it("stores omitted optional fields as null", async () => {
    const response = await submitAgencyRequest({
      requesterEmail: "minimal-agency@example.com",
      agencyName: "Minimal Agency Request",
    });

    const body = await response.json() as AgencyRequestsContracts.SubmitAgencyRequestResponse;

    expect(response.status).toBe(201);
    expect(body.requesterPhone).toBeNull();
    expect(body.agencyAddress).toBeNull();
    expect(body.agencyContactPhone).toBeNull();
    expect(body.description).toBeNull();

    const saved = await fixture.prisma.agencyRequest.findUnique({
      where: { id: body.id },
      select: {
        requesterPhone: true,
        agencyAddress: true,
        agencyContactPhone: true,
        description: true,
      },
    });

    expect(saved).toEqual({
      requesterPhone: null,
      agencyAddress: null,
      agencyContactPhone: null,
      description: null,
    });
  });

  it("rejects invalid requester email", async () => {
    const beforeCount = await fixture.prisma.agencyRequest.count();

    const response = await submitAgencyRequest({
      requesterEmail: "not-an-email",
      agencyName: "Invalid Email Agency Request",
    });

    const body = await response.json() as {
      error: string;
      details?: {
        code?: string;
        issues?: Array<{ path?: string; message: string }>;
      };
    };

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
    expect(body.details?.issues?.some(issue => issue.path?.includes("requesterEmail"))).toBe(true);
    expect(await fixture.prisma.agencyRequest.count()).toBe(beforeCount);
  });

  it("rejects empty agency name", async () => {
    const beforeCount = await fixture.prisma.agencyRequest.count();

    const response = await submitAgencyRequest({
      requesterEmail: "empty-name@example.com",
      agencyName: "",
    });

    const body = await response.json() as {
      error: string;
      details?: {
        code?: string;
        issues?: Array<{ path?: string; message: string }>;
      };
    };

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
    expect(body.details?.issues?.some(issue => issue.path?.includes("agencyName"))).toBe(true);
    expect(await fixture.prisma.agencyRequest.count()).toBe(beforeCount);
  });

  it("rejects invalid requester phone", async () => {
    const beforeCount = await fixture.prisma.agencyRequest.count();

    const response = await submitAgencyRequest({
      requesterEmail: "invalid-phone@example.com",
      requesterPhone: "123",
      agencyName: "Invalid Phone Agency Request",
    });

    const body = await response.json() as {
      error: string;
      details?: {
        code?: string;
        issues?: Array<{ path?: string; message: string }>;
      };
    };

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
    expect(body.details?.issues?.some(issue => issue.path?.includes("requesterPhone"))).toBe(true);
    expect(await fixture.prisma.agencyRequest.count()).toBe(beforeCount);
  });

  it("admin can list agency requests with filters and pagination", async () => {
    const requester = await fixture.factories.user({
      email: "agency-request-filter-user@example.com",
      role: "USER",
    });

    await fixture.prisma.agencyRequest.create({
      data: {
        requesterUserId: requester.id,
        requesterEmail: "matched-agency@example.com",
        agencyName: "Matched Agency",
        requesterPhone: "0912345678",
        status: "PENDING",
        createdAt: new Date("2026-03-20T00:00:00.000Z"),
      },
    });

    await fixture.prisma.agencyRequest.create({
      data: {
        requesterEmail: "other-agency@example.com",
        agencyName: "Other Agency",
        status: "APPROVED",
        reviewedByUserId: ADMIN_USER_ID,
        reviewedAt: new Date("2026-03-21T00:00:00.000Z"),
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await listAgencyRequests("?page=1&pageSize=10&status=PENDING&requesterEmail=matched", {
      token,
    });
    const body = await response.json() as AgencyRequestsContracts.AgencyRequestListResponse;

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toEqual({
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
    expect(body.data[0]).toMatchObject({
      requesterEmail: "matched-agency@example.com",
      agencyName: "Matched Agency",
      status: "PENDING",
      requesterUser: {
        id: requester.id,
        email: requester.email,
      },
    });
  });

  it("admin list defaults to newest requests first", async () => {
    await fixture.prisma.agencyRequest.create({
      data: {
        requesterEmail: "older-agency@example.com",
        agencyName: "Older Agency",
        status: "PENDING",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
      },
    });

    const newer = await fixture.prisma.agencyRequest.create({
      data: {
        requesterEmail: "newer-agency@example.com",
        agencyName: "Newer Agency",
        status: "PENDING",
        createdAt: new Date("2026-03-25T00:00:00.000Z"),
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await listAgencyRequests("?page=1&pageSize=10", { token });
    const body = await response.json() as AgencyRequestsContracts.AgencyRequestListResponse;

    expect(response.status).toBe(200);
    expect(body.data[0]?.id).toBe(newer.id);
  });

  it("admin can get agency request details by id", async () => {
    const requester = await fixture.factories.user({
      email: "agency-request-detail-user@example.com",
      role: "USER",
    });

    const reviewedByUser = await fixture.prisma.user.create({
      data: {
        id: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd305",
        fullName: "Reviewer Admin",
        email: "reviewer-admin@example.com",
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
    });

    const approvedAgency = await fixture.prisma.agency.create({
      data: {
        id: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd306",
        name: "Detail Approved Agency",
        address: "1 Detail Street",
        contactPhone: "0900000001",
      },
    });

    const createdAgencyUser = await fixture.prisma.user.create({
      data: {
        id: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd307",
        fullName: "Agency Owner",
        email: "agency-owner@example.com",
        passwordHash: "hash123",
        phoneNumber: null,
        username: null,
        avatarUrl: null,
        locationText: null,
        nfcCardUid: null,
        role: "AGENCY",
        accountStatus: "ACTIVE",
        verifyStatus: "VERIFIED",
      },
    });

    const agencyRequest = await fixture.prisma.agencyRequest.create({
      data: {
        requesterUserId: requester.id,
        requesterEmail: "detail-request@example.com",
        requesterPhone: "0912222222",
        agencyName: "Detail Agency",
        agencyAddress: "99 Detail Avenue",
        agencyContactPhone: "0988888888",
        status: "APPROVED",
        description: "Approved after full review",
        reviewedByUserId: reviewedByUser.id,
        reviewedAt: new Date("2026-03-26T09:00:00.000Z"),
        approvedAgencyId: approvedAgency.id,
        createdAgencyUserId: createdAgencyUser.id,
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await getAgencyRequestById(agencyRequest.id, { token });
    const body = await response.json() as AgencyRequestsContracts.AgencyRequestDetailResponse;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: agencyRequest.id,
      requesterEmail: "detail-request@example.com",
      agencyName: "Detail Agency",
      status: "APPROVED",
      requesterUser: {
        id: requester.id,
        email: requester.email,
      },
      reviewedByUser: {
        id: reviewedByUser.id,
        email: reviewedByUser.email,
      },
      approvedAgency: {
        id: approvedAgency.id,
        name: approvedAgency.name,
      },
      createdAgencyUser: {
        id: createdAgencyUser.id,
        email: createdAgencyUser.email,
      },
    });
  });

  it("requester can cancel their own pending agency request", async () => {
    const requester = await fixture.factories.user({
      email: "agency-request-cancel-owner@example.com",
      role: "USER",
    });

    const agencyRequest = await fixture.prisma.agencyRequest.create({
      data: {
        requesterUserId: requester.id,
        requesterEmail: requester.email,
        agencyName: "Cancelable Agency",
        status: "PENDING",
        description: "Original request description",
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: requester.id, role: "USER" });
    const response = await cancelAgencyRequest(agencyRequest.id, { token });
    const body = await response.json() as AgencyRequestsContracts.AgencyRequest;

    expect(response.status).toBe(200);
    expect(body.status).toBe("CANCELLED");
    expect(body.description).toBe("Original request description");

    const saved = await fixture.prisma.agencyRequest.findUnique({
      where: { id: agencyRequest.id },
      select: {
        status: true,
        description: true,
      },
    });

    expect(saved).toEqual({
      status: "CANCELLED",
      description: "Original request description",
    });
  });

  it("rejects cancel when agency request belongs to another user", async () => {
    const requester = await fixture.factories.user({
      email: "agency-request-real-owner@example.com",
      role: "USER",
    });
    const otherUser = await fixture.factories.user({
      email: "agency-request-other-user@example.com",
      role: "USER",
    });

    const agencyRequest = await fixture.prisma.agencyRequest.create({
      data: {
        requesterUserId: requester.id,
        requesterEmail: requester.email,
        agencyName: "Owned By Someone Else",
        status: "PENDING",
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: otherUser.id, role: "USER" });
    const response = await cancelAgencyRequest(agencyRequest.id, { token });
    const body = await response.json() as AgencyRequestsContracts.AgencyRequestErrorResponse;

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Agency request does not belong to user",
      details: {
        code: "AGENCY_REQUEST_NOT_OWNED",
        agencyRequestId: agencyRequest.id,
        userId: otherUser.id,
      },
    });

    const saved = await fixture.prisma.agencyRequest.findUnique({
      where: { id: agencyRequest.id },
      select: { status: true },
    });

    expect(saved?.status).toBe("PENDING");
  });

  it("returns 404 when requester cancels an unknown agency request", async () => {
    const requester = await fixture.factories.user({
      email: "agency-request-cancel-not-found@example.com",
      role: "USER",
    });

    const token = fixture.auth.makeAccessToken({ userId: requester.id, role: "USER" });
    const response = await cancelAgencyRequest("0195e4f7-f7d3-7b7a-8fd8-5f2df87fd355", { token });
    const body = await response.json() as AgencyRequestsContracts.AgencyRequestErrorResponse;

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Agency request not found",
      details: {
        code: "AGENCY_REQUEST_NOT_FOUND",
        agencyRequestId: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd355",
      },
    });
  });

  it("rejects cancel when agency request is no longer pending", async () => {
    const requester = await fixture.factories.user({
      email: "agency-request-cancel-transition@example.com",
      role: "USER",
    });

    const agencyRequest = await fixture.prisma.agencyRequest.create({
      data: {
        requesterUserId: requester.id,
        requesterEmail: requester.email,
        agencyName: "Already Approved Agency",
        status: "APPROVED",
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: requester.id, role: "USER" });
    const response = await cancelAgencyRequest(agencyRequest.id, { token });
    const body = await response.json() as AgencyRequestsContracts.AgencyRequestErrorResponse;

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Invalid agency request status transition",
      details: {
        code: "INVALID_AGENCY_REQUEST_STATUS_TRANSITION",
        agencyRequestId: agencyRequest.id,
        currentStatus: "APPROVED",
        nextStatus: "CANCELLED",
      },
    });
  });

  it("returns 404 when admin gets an unknown agency request", async () => {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await getAgencyRequestById("0195e4f7-f7d3-7b7a-8fd8-5f2df87fd399", { token });
    const body = await response.json() as AgencyRequestsContracts.AgencyRequestErrorResponse;

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Agency request not found",
      details: {
        code: "AGENCY_REQUEST_NOT_FOUND",
        agencyRequestId: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd399",
      },
    });
  });

  it("rejects admin list for non-admin users", async () => {
    const user = await fixture.factories.user({
      email: "agency-request-plain-user@example.com",
      role: "USER",
    });

    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });
    const response = await listAgencyRequests("?page=1&pageSize=10", { token });

    expect(response.status).toBe(403);
  });

  it("requires authentication for admin list", async () => {
    const response = await listAgencyRequests("?page=1&pageSize=10");

    expect(response.status).toBe(401);
  });

  it("requires authentication for admin get detail", async () => {
    const response = await getAgencyRequestById("0195e4f7-f7d3-7b7a-8fd8-5f2df87fd301");

    expect(response.status).toBe(401);
  });

  it("requires authentication for requester cancel", async () => {
    const agencyRequest = await fixture.prisma.agencyRequest.create({
      data: {
        requesterEmail: "agency-request-cancel-auth@example.com",
        agencyName: "Auth Required Agency",
        status: "PENDING",
      },
    });

    const response = await cancelAgencyRequest(agencyRequest.id);

    expect(response.status).toBe(401);
  });

  it("rejects admin get detail for non-admin users", async () => {
    const user = await fixture.factories.user({
      email: "agency-request-detail-plain-user@example.com",
      role: "USER",
    });

    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });
    const response = await getAgencyRequestById("0195e4f7-f7d3-7b7a-8fd8-5f2df87fd301", { token });

    expect(response.status).toBe(403);
  });

  it("rejects invalid admin list query", async () => {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await listAgencyRequests("?page=0&status=UNKNOWN", { token });
    const body = await response.json() as {
      error: string;
      details?: {
        code?: string;
      };
    };

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
  });

  it("rejects invalid agency request id param", async () => {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await getAgencyRequestById("not-a-uuid", { token });
    const body = await response.json() as {
      error: string;
      details?: {
        code?: string;
        issues?: Array<{ path?: string; message: string }>;
      };
    };

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
    expect(body.details?.issues?.some(issue => issue.path?.includes("id"))).toBe(true);
  });

  it("rejects invalid cancel agency request id param", async () => {
    const requester = await fixture.factories.user({
      email: "agency-request-cancel-invalid-id@example.com",
      role: "USER",
    });

    const token = fixture.auth.makeAccessToken({ userId: requester.id, role: "USER" });
    const response = await cancelAgencyRequest("not-a-uuid", { token });
    const body = await response.json() as {
      error: string;
      details?: {
        code?: string;
        issues?: Array<{ path?: string; message: string }>;
      };
    };

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload");
    expect(body.details?.code).toBe("VALIDATION_ERROR");
    expect(body.details?.issues?.some(issue => issue.path?.includes("id"))).toBe(true);
  });
});
