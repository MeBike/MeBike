import type { AgencyRequestsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22311";
const DEFAULT_STATION_REQUEST_FIELDS = {
  stationName: "Ga Demo Agency",
  stationAddress: "1 Demo Agency Street",
  stationLatitude: 10.8231,
  stationLongitude: 106.7712,
  stationTotalCapacity: 20,
  stationPickupSlotLimit: 12,
  stationReturnSlotLimit: 18,
} as const;

describe("agency requests routing", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { AgencyRequestRepositoryLive } = await import("@/domain/agency-requests/repository/agency-request.repository");
      const { AgencyRequestServiceLive } = await import("@/domain/agency-requests/services/agency-request.service");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      const agencyRequestRepoLayer = AgencyRequestRepositoryLive.pipe(Layer.provide(PrismaLive));
      const agencyRequestServiceLayer = AgencyRequestServiceLive.pipe(
        Layer.provide(agencyRequestRepoLayer),
        Layer.provide(PrismaLive),
      );

      return Layer.mergeAll(
        UserDepsLive,
        agencyRequestRepoLayer,
        agencyRequestServiceLayer,
        PrismaLive,
      );
    },
    seedData: async (_db, prisma) => {
      const { upsertVietnamBoundary } = await import("../../../../prisma/seed-geo-boundary");
      await upsertVietnamBoundary(prisma);

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

  async function approveAgencyRequest(
    agencyRequestId: string,
    body: Record<string, unknown> = {},
    init?: { token?: string },
  ) {
    return fixture.app.request(`http://test/v1/admin/agency-requests/${agencyRequestId}/approve`, {
      method: "POST",
      headers: {
        ...(init?.token ? { Authorization: `Bearer ${init.token}` } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  async function rejectAgencyRequest(
    agencyRequestId: string,
    body: Record<string, unknown>,
    init?: { token?: string },
  ) {
    return fixture.app.request(`http://test/v1/admin/agency-requests/${agencyRequestId}/reject`, {
      method: "POST",
      headers: {
        ...(init?.token ? { Authorization: `Bearer ${init.token}` } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  it("submits an agency request without authentication", async () => {
    const response = await submitAgencyRequest({
      requesterEmail: "guest-agency@example.com",
      requesterPhone: "0912345678",
      agencyName: "Guest Agency Request",
      agencyAddress: "1 Guest Street",
      agencyContactPhone: "0987654321",
      ...DEFAULT_STATION_REQUEST_FIELDS,
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
      ...DEFAULT_STATION_REQUEST_FIELDS,
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
      ...DEFAULT_STATION_REQUEST_FIELDS,
    });

    const body = await response.json() as AgencyRequestsContracts.SubmitAgencyRequestResponse;

    expect(response.status).toBe(201);
    expect(body.requesterPhone).toBeNull();
    expect(body.agencyAddress).toBeNull();
    expect(body.agencyContactPhone).toBeNull();
    expect(body.stationName).toBe(DEFAULT_STATION_REQUEST_FIELDS.stationName);
    expect(body.stationAddress).toBe(DEFAULT_STATION_REQUEST_FIELDS.stationAddress);
    expect(body.description).toBeNull();

    const saved = await fixture.prisma.agencyRequest.findUnique({
      where: { id: body.id },
      select: {
        requesterPhone: true,
        agencyAddress: true,
        agencyContactPhone: true,
        stationName: true,
        stationAddress: true,
        description: true,
      },
    });

    expect(saved).toEqual({
      requesterPhone: null,
      agencyAddress: null,
      agencyContactPhone: null,
      stationName: DEFAULT_STATION_REQUEST_FIELDS.stationName,
      stationAddress: DEFAULT_STATION_REQUEST_FIELDS.stationAddress,
      description: null,
    });
  });

  it("rejects invalid requester email", async () => {
    const beforeCount = await fixture.prisma.agencyRequest.count();

    const response = await submitAgencyRequest({
      requesterEmail: "not-an-email",
      agencyName: "Invalid Email Agency Request",
      ...DEFAULT_STATION_REQUEST_FIELDS,
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
      ...DEFAULT_STATION_REQUEST_FIELDS,
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
      ...DEFAULT_STATION_REQUEST_FIELDS,
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
        stationName: "Ga Detail Agency",
        stationAddress: "99 Detail Avenue",
        stationLatitude: 10.8235,
        stationLongitude: 106.7723,
        stationTotalCapacity: 24,
        stationPickupSlotLimit: 16,
        stationReturnSlotLimit: 20,
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

  it("admin can approve a pending request and provision agency account", async () => {
    const agencyRequest = await fixture.prisma.agencyRequest.create({
      data: {
        requesterEmail: "approved-agency-request@example.com",
        requesterPhone: "0912345678",
        agencyName: "Provisioned Agency",
        agencyAddress: "12 Agency Street",
        agencyContactPhone: "0987654321",
        stationName: "Ga Provisioned Agency",
        stationAddress: "12 Agency Street",
        stationLatitude: 10.8123,
        stationLongitude: 106.7456,
        stationTotalCapacity: 20,
        stationPickupSlotLimit: 14,
        stationReturnSlotLimit: 20,
        status: "PENDING",
        description: "Original requester note",
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await approveAgencyRequest(agencyRequest.id, {}, { token });
    const body = await response.json() as AgencyRequestsContracts.AgencyRequestDetailResponse;

    expect(response.status).toBe(200);
    expect(body.status).toBe("APPROVED");
    expect(body.reviewedByUserId).toBe(ADMIN_USER_ID);
    expect(body.approvedAgencyId).not.toBeNull();
    expect(body.createdAgencyUserId).not.toBeNull();
    expect(body.description).toBe("Original requester note");
    expect(body.approvedAgency).toMatchObject({
      name: "Provisioned Agency",
    });
    expect(body.createdAgencyUser?.email).toMatch(/^agency\+[a-f0-9]+@accounts\.mebike\.local$/);

    const savedAgency = await fixture.prisma.agency.findUnique({
      where: { id: body.approvedAgencyId! },
    });

    expect(savedAgency).toMatchObject({
      id: body.approvedAgencyId,
      name: "Provisioned Agency",
      contactPhone: "0987654321",
      status: "ACTIVE",
    });

    const savedStation = await fixture.prisma.station.findUnique({
      where: { agencyId: body.approvedAgencyId! },
      select: {
        agencyId: true,
        name: true,
        address: true,
        stationType: true,
        latitude: true,
        longitude: true,
        totalCapacity: true,
        pickupSlotLimit: true,
        returnSlotLimit: true,
      },
    });

    expect(savedStation).toEqual({
      agencyId: body.approvedAgencyId,
      name: "Ga Provisioned Agency",
      address: "12 Agency Street",
      stationType: "AGENCY",
      latitude: expect.anything(),
      longitude: expect.anything(),
      totalCapacity: 20,
      pickupSlotLimit: 14,
      returnSlotLimit: 20,
    });

    const savedAgencyUser = await fixture.prisma.user.findUnique({
      where: { id: body.createdAgencyUserId! },
      select: {
        id: true,
        email: true,
        username: true,
        phoneNumber: true,
        role: true,
        accountStatus: true,
        verifyStatus: true,
      },
    });

    expect(savedAgencyUser).toMatchObject({
      id: body.createdAgencyUserId,
      role: "AGENCY",
      accountStatus: "ACTIVE",
      verifyStatus: "VERIFIED",
      phoneNumber: null,
    });
    expect(savedAgencyUser?.email).toMatch(/^agency\+[a-f0-9]+@accounts\.mebike\.local$/);
    expect(savedAgencyUser?.username).toMatch(/^agency_[a-f0-9]+$/);

    const savedAssignment = await fixture.prisma.userOrgAssignment.findUnique({
      where: { userId: body.createdAgencyUserId! },
      select: {
        userId: true,
        agencyId: true,
        stationId: true,
        technicianTeamId: true,
      },
    });

    expect(savedAssignment).toEqual({
      userId: body.createdAgencyUserId,
      agencyId: body.approvedAgencyId,
      stationId: null,
      technicianTeamId: null,
    });

    const savedRequest = await fixture.prisma.agencyRequest.findUnique({
      where: { id: agencyRequest.id },
      select: {
        status: true,
        reviewedByUserId: true,
        approvedAgencyId: true,
        createdAgencyUserId: true,
        description: true,
      },
    });

    expect(savedRequest).toEqual({
      status: "APPROVED",
      reviewedByUserId: ADMIN_USER_ID,
      approvedAgencyId: body.approvedAgencyId,
      createdAgencyUserId: body.createdAgencyUserId,
      description: "Original requester note",
    });

    const emailOutbox = await fixture.prisma.jobOutbox.findFirst({
      where: { dedupeKey: `agency-request-approved:${agencyRequest.id}` },
      select: {
        type: true,
        payload: true,
        status: true,
      },
    });

    expect(emailOutbox?.type).toBe("emails.send");
    expect(emailOutbox?.status).toBe("PENDING");
    expect(emailOutbox?.payload).toMatchObject({
      version: 1,
      kind: "raw",
      to: "approved-agency-request@example.com",
      subject: "MeBike phê duyệt tài khoản Agency",
    });
  });

  it("returns 404 when admin approves an unknown agency request", async () => {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await approveAgencyRequest("0195e4f7-f7d3-7b7a-8fd8-5f2df87fd398", {}, { token });
    const body = await response.json() as AgencyRequestsContracts.AgencyRequestErrorResponse;

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Agency request not found",
      details: {
        code: "AGENCY_REQUEST_NOT_FOUND",
        agencyRequestId: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd398",
      },
    });
  });

  it("rejects approving an agency request that is no longer pending", async () => {
    const agencyRequest = await fixture.prisma.agencyRequest.create({
      data: {
        requesterEmail: "already-approved-agency@example.com",
        agencyName: "Already Approved Agency",
        status: "APPROVED",
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await approveAgencyRequest(agencyRequest.id, {}, { token });
    const body = await response.json() as AgencyRequestsContracts.AgencyRequestErrorResponse;

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Invalid agency request status transition",
      details: {
        code: "INVALID_AGENCY_REQUEST_STATUS_TRANSITION",
        agencyRequestId: agencyRequest.id,
        currentStatus: "APPROVED",
        nextStatus: "APPROVED",
      },
    });
  });

  it("admin can reject a pending request with reason alias", async () => {
    const agencyRequest = await fixture.prisma.agencyRequest.create({
      data: {
        requesterEmail: "rejected-agency-request@example.com",
        requesterPhone: "0912222333",
        agencyName: "Rejected Agency",
        status: "PENDING",
        description: "Initial requester note",
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await rejectAgencyRequest(agencyRequest.id, {
      reason: "Business registration documents are incomplete.",
    }, { token });
    const body = await response.json() as AgencyRequestsContracts.AgencyRequestDetailResponse;

    expect(response.status).toBe(200);
    expect(body.status).toBe("REJECTED");
    expect(body.reviewedByUserId).toBe(ADMIN_USER_ID);
    expect(body.description).toBe("Business registration documents are incomplete.");
    expect(body.approvedAgencyId).toBeNull();
    expect(body.createdAgencyUserId).toBeNull();

    const savedRequest = await fixture.prisma.agencyRequest.findUnique({
      where: { id: agencyRequest.id },
      select: {
        status: true,
        reviewedByUserId: true,
        approvedAgencyId: true,
        createdAgencyUserId: true,
        description: true,
      },
    });

    expect(savedRequest).toEqual({
      status: "REJECTED",
      reviewedByUserId: ADMIN_USER_ID,
      approvedAgencyId: null,
      createdAgencyUserId: null,
      description: "Business registration documents are incomplete.",
    });
  });

  it("rejects admin reject when both reason and description are missing", async () => {
    const agencyRequest = await fixture.prisma.agencyRequest.create({
      data: {
        requesterEmail: "reject-validation@example.com",
        agencyName: "Reject Validation Agency",
        status: "PENDING",
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await rejectAgencyRequest(agencyRequest.id, {}, { token });
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
    expect(body.details?.issues?.some(issue => issue.path?.includes("reason"))).toBe(true);
    expect(body.details?.issues?.some(issue => issue.path?.includes("description"))).toBe(true);

    const savedRequest = await fixture.prisma.agencyRequest.findUnique({
      where: { id: agencyRequest.id },
      select: { status: true, reviewedByUserId: true },
    });

    expect(savedRequest).toEqual({
      status: "PENDING",
      reviewedByUserId: null,
    });
  });

  it("returns 404 when admin rejects an unknown agency request", async () => {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await rejectAgencyRequest("0195e4f7-f7d3-7b7a-8fd8-5f2df87fd397", {
      reason: "Documents are incomplete",
    }, { token });
    const body = await response.json() as AgencyRequestsContracts.AgencyRequestErrorResponse;

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Agency request not found",
      details: {
        code: "AGENCY_REQUEST_NOT_FOUND",
        agencyRequestId: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd397",
      },
    });
  });

  it("rejects admin reject when agency request is no longer pending", async () => {
    const agencyRequest = await fixture.prisma.agencyRequest.create({
      data: {
        requesterEmail: "already-rejected-agency@example.com",
        agencyName: "Already Rejected Agency",
        status: "REJECTED",
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await rejectAgencyRequest(agencyRequest.id, {
      description: "Still rejected",
    }, { token });
    const body = await response.json() as AgencyRequestsContracts.AgencyRequestErrorResponse;

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Invalid agency request status transition",
      details: {
        code: "INVALID_AGENCY_REQUEST_STATUS_TRANSITION",
        agencyRequestId: agencyRequest.id,
        currentStatus: "REJECTED",
        nextStatus: "REJECTED",
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

  it("requires authentication for admin approve", async () => {
    const response = await approveAgencyRequest("0195e4f7-f7d3-7b7a-8fd8-5f2df87fd301");

    expect(response.status).toBe(401);
  });

  it("requires authentication for admin reject", async () => {
    const response = await rejectAgencyRequest("0195e4f7-f7d3-7b7a-8fd8-5f2df87fd301", {
      reason: "Missing documents",
    });

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

  it("rejects admin approve for non-admin users", async () => {
    const user = await fixture.factories.user({
      email: "agency-request-approve-plain-user@example.com",
      role: "USER",
    });

    const agencyRequest = await fixture.prisma.agencyRequest.create({
      data: {
        requesterEmail: "plain-user-approve@example.com",
        agencyName: "Forbidden Approve Agency",
        status: "PENDING",
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });
    const response = await approveAgencyRequest(agencyRequest.id, {}, { token });

    expect(response.status).toBe(403);
  });

  it("rejects admin reject for non-admin users", async () => {
    const user = await fixture.factories.user({
      email: "agency-request-reject-plain-user@example.com",
      role: "USER",
    });

    const agencyRequest = await fixture.prisma.agencyRequest.create({
      data: {
        requesterEmail: "plain-user-reject@example.com",
        agencyName: "Forbidden Reject Agency",
        status: "PENDING",
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });
    const response = await rejectAgencyRequest(agencyRequest.id, {
      reason: "Forbidden",
    }, { token });

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

  it("rejects invalid admin approve agency request id param", async () => {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await approveAgencyRequest("not-a-uuid", {}, { token });
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

  it("rejects invalid admin reject agency request id param", async () => {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    const response = await rejectAgencyRequest("not-a-uuid", {
      reason: "Missing documents",
    }, { token });
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
