import type { AgencyRequestsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("agency requests routing", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { UserRepositoryLive } = await import("@/domain/users/repository/user.repository");
      const { UserServiceLive } = await import("@/domain/users/services/user.service");
      const { AgencyRequestRepositoryLive } = await import("@/domain/agency-requests/repository/agency-request.repository");
      const { AgencyRequestServiceLive } = await import("@/domain/agency-requests/services/agency-request.service");

      const userRepoLayer = UserRepositoryLive.pipe(Layer.provide(PrismaLive));
      const userServiceLayer = UserServiceLive.pipe(Layer.provide(userRepoLayer));
      const agencyRequestRepoLayer = AgencyRequestRepositoryLive.pipe(Layer.provide(PrismaLive));
      const agencyRequestServiceLayer = AgencyRequestServiceLive.pipe(Layer.provide(agencyRequestRepoLayer));

      return Layer.mergeAll(
        userRepoLayer,
        userServiceLayer,
        agencyRequestRepoLayer,
        agencyRequestServiceLayer,
        PrismaLive,
      );
    },
  });

  it("submits an agency request without authentication", async () => {
    const response = await fixture.app.request("http://test/v1/agency-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requesterEmail: "guest-agency@example.com",
        requesterPhone: "0912345678",
        agencyName: "Guest Agency Request",
        agencyAddress: "1 Guest Street",
        agencyContactPhone: "0987654321",
        description: "Guest request description",
      }),
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

    const response = await fixture.app.request("http://test/v1/agency-requests", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requesterEmail: "user-agency@example.com",
        requesterPhone: "0911111111",
        agencyName: "User Agency Request",
      }),
    });

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
});
