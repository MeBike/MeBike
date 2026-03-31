import type {
  UsersContracts,
} from "@mebike/shared";

import {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
} from "@mebike/shared";
import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("agency auth access e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");
      return UserDepsLive;
    },
  });

  async function getMe(token?: string) {
    return fixture.app.request("http://test/v1/users/me", {
      method: "GET",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    });
  }

  it("blocks an existing agency token once the assigned agency becomes suspended", async () => {
    const agencyUser = await fixture.factories.user({
      email: "agency-auth-access@example.com",
      role: "AGENCY",
      accountStatus: "ACTIVE",
      verify: "VERIFIED",
    });
    const agency = await fixture.prisma.agency.create({
      data: {
        name: "Agency Access Test",
        status: "ACTIVE",
      },
    });
    await fixture.factories.userOrgAssignment({
      userId: agencyUser.id,
      agencyId: agency.id,
    });

    const token = fixture.auth.makeAccessToken({
      userId: agencyUser.id,
      role: "AGENCY",
    });

    const activeResponse = await getMe(token);
    const activeBody = await activeResponse.json() as UsersContracts.MeResponse;

    expect(activeResponse.status).toBe(200);
    expect(activeBody.email).toBe("agency-auth-access@example.com");

    await fixture.prisma.agency.update({
      where: { id: agency.id },
      data: {
        status: "SUSPENDED",
      },
    });

    const suspendedResponse = await getMe(token);
    const suspendedBody = await suspendedResponse.json() as {
      error: string;
      details: {
        code: string;
      };
    };

    expect(suspendedResponse.status).toBe(403);
    expect(suspendedBody).toEqual({
      error: unauthorizedErrorMessages.UNAUTHORIZED,
      details: {
        code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED,
      },
    });
  });
});
