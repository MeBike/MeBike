import type { AgencyRequestsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

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
});
