import type { UsersContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22321";

describe("manage-users agency provision e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");
      return UserDepsLive;
    },
    seedData: async (_db, prisma) => {
      const { upsertVietnamBoundary } = await import("../../../../prisma/seed-geo-boundary");
      await upsertVietnamBoundary(prisma);

      await prisma.user.create({
        data: {
          id: ADMIN_USER_ID,
          fullName: "Route Admin",
          email: "route-admin@example.com",
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

  function adminAuthHeader() {
    const token = fixture.auth.makeAccessToken({ userId: ADMIN_USER_ID, role: "ADMIN" });
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  it("provisions agency, station, agency user, provenance request, and email when admin creates role AGENCY", async () => {
    const response = await fixture.app.request("http://test/v1/users/manage-users/create", {
      method: "POST",
      headers: adminAuthHeader(),
      body: JSON.stringify({
        role: "AGENCY",
        requesterEmail: "agency-owner@example.com",
        requesterPhone: "0912345678",
        agencyName: "Metro Agency Thu Duc",
        agencyAddress: "Tret toa nha Metro Thu Duc",
        agencyContactPhone: "0987654321",
        stationName: "Ga Metro Thu Duc",
        stationAddress: "01 Xa Lo Ha Noi, Thu Duc, TP.HCM",
        stationLatitude: 10.8486,
        stationLongitude: 106.7717,
        stationTotalCapacity: 20,
        stationPickupSlotLimit: 12,
        stationReturnSlotLimit: 18,
        description: "Admin tao truc tiep doi tac agency moi.",
      }),
    });

    const body = await response.json() as UsersContracts.AdminUserDetailResponse;

    expect(response.status).toBe(201);
    expect(body.role).toBe("AGENCY");
    expect(body.orgAssignment?.agency).not.toBeNull();
    expect(body.orgAssignment?.station).toBeNull();
    expect(body.email).toMatch(/^agency\+[a-f0-9]+@accounts\.mebike\.local$/);
    expect(body.fullName).toBe("Agency Admin - Metro Agency Thu Duc");

    const savedAssignment = await fixture.prisma.userOrgAssignment.findUnique({
      where: { userId: body.id },
      select: {
        agencyId: true,
        stationId: true,
        technicianTeamId: true,
      },
    });

    expect(savedAssignment).toEqual({
      agencyId: body.orgAssignment?.agency?.id,
      stationId: null,
      technicianTeamId: null,
    });

    const savedAgency = await fixture.prisma.agency.findUnique({
      where: { id: body.orgAssignment!.agency!.id },
      select: {
        id: true,
        name: true,
        contactPhone: true,
        status: true,
      },
    });

    expect(savedAgency).toEqual({
      id: body.orgAssignment?.agency?.id,
      name: "Metro Agency Thu Duc",
      contactPhone: "0987654321",
      status: "ACTIVE",
    });

    const savedStation = await fixture.prisma.station.findUnique({
      where: { agencyId: body.orgAssignment!.agency!.id },
      select: {
        name: true,
        address: true,
        stationType: true,
        totalCapacity: true,
        returnSlotLimit: true,
      },
    });

    expect(savedStation).toEqual({
      name: "Ga Metro Thu Duc",
      address: "01 Xa Lo Ha Noi, Thu Duc, TP.HCM",
      stationType: "AGENCY",
      totalCapacity: 20,
      returnSlotLimit: 18,
    });

    const savedRequest = await fixture.prisma.agencyRequest.findFirst({
      where: {
        createdAgencyUserId: body.id,
      },
      select: {
        id: true,
        requesterUserId: true,
        requesterEmail: true,
        requesterPhone: true,
        agencyName: true,
        agencyAddress: true,
        agencyContactPhone: true,
        stationName: true,
        stationAddress: true,
        status: true,
        reviewedByUserId: true,
        approvedAgencyId: true,
        createdAgencyUserId: true,
        description: true,
      },
    });

    expect(savedRequest).toEqual({
      id: expect.any(String),
      requesterUserId: null,
      requesterEmail: "agency-owner@example.com",
      requesterPhone: "0912345678",
      agencyName: "Metro Agency Thu Duc",
      agencyAddress: "Tret toa nha Metro Thu Duc",
      agencyContactPhone: "0987654321",
      stationName: "Ga Metro Thu Duc",
      stationAddress: "01 Xa Lo Ha Noi, Thu Duc, TP.HCM",
      status: "APPROVED",
      reviewedByUserId: ADMIN_USER_ID,
      approvedAgencyId: body.orgAssignment?.agency?.id,
      createdAgencyUserId: body.id,
      description: "Admin tao truc tiep doi tac agency moi.",
    });

    const savedApprovalEmailOutbox = await fixture.prisma.jobOutbox.findFirst({
      where: {
        dedupeKey: `agency-request-approved:${savedRequest!.id}`,
      },
      select: {
        type: true,
        status: true,
        payload: true,
        dedupeKey: true,
      },
    });

    expect(savedApprovalEmailOutbox?.type).toBe("emails.send");
    expect(savedApprovalEmailOutbox?.status).toBe("PENDING");
    expect(savedApprovalEmailOutbox?.payload).toMatchObject({
      version: 1,
      kind: "raw",
      to: "agency-owner@example.com",
      subject: "MeBike phê duyệt tài khoản Agency",
    });
    expect(savedApprovalEmailOutbox?.dedupeKey).toBeTruthy();
  });

  it("returns station provisioning error when admin creates agency with duplicate station name", async () => {
    await fixture.factories.station({
      name: "Ga Metro Trung Ten",
    });

    const response = await fixture.app.request("http://test/v1/users/manage-users/create", {
      method: "POST",
      headers: adminAuthHeader(),
      body: JSON.stringify({
        role: "AGENCY",
        requesterEmail: "duplicate-station-owner@example.com",
        agencyName: "Duplicate Station Agency",
        stationName: "Ga Metro Trung Ten",
        stationAddress: "02 Xa Lo Ha Noi, Thu Duc, TP.HCM",
        stationLatitude: 10.8486,
        stationLongitude: 106.7717,
        stationTotalCapacity: 20,
      }),
    });

    const body = await response.json() as UsersContracts.UserErrorResponse;

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Station name already exists",
      details: {
        code: "STATION_NAME_ALREADY_EXISTS",
      },
    });
  });
});
