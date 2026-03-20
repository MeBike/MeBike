import { Effect, Either } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { expectLeftTag, expectRight } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeAgencyRequestRepository } from "../agency-request.repository";

describe("agencyRequestRepository Integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeAgencyRequestRepository>;

  beforeAll(() => {
    repo = makeAgencyRequestRepository(fixture.prisma);
  });

  async function createUser(role: "USER" | "ADMIN" | "AGENCY" = "USER") {
    const user = await fixture.factories.user({
      fullname: `${role} User`,
      role,
    });

    return { id: user.id };
  }

  async function createAgencyRequest(status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" = "PENDING") {
    const requester = await createUser("USER");

    return fixture.prisma.agencyRequest.create({
      data: {
        id: uuidv7(),
        requesterUserId: requester.id,
        requesterEmail: `request-${requester.id}@example.com`,
        agencyName: "Agency Request",
        status,
      },
      select: { id: true },
    });
  }

  async function createApprovalRefs() {
    const reviewer = await createUser("ADMIN");
    const agencyUser = await createUser("AGENCY");
    const agency = await fixture.prisma.agency.create({
      data: {
        id: uuidv7(),
        name: "Approved Agency",
      },
      select: { id: true },
    });

    return {
      reviewer,
      agencyUser,
      agency,
    };
  }

  it("approves a pending request atomically", async () => {
    const request = await createAgencyRequest("PENDING");
    const refs = await createApprovalRefs();

    const result = await Effect.runPromise(repo.approve(request.id, {
      reviewedByUserId: refs.reviewer.id,
      approvedAgencyId: refs.agency.id,
      createdAgencyUserId: refs.agencyUser.id,
      description: "Approved",
    }).pipe(Effect.either));

    const approved = expectRight(result);
    expect(approved.status).toBe("APPROVED");
    expect(approved.reviewedByUserId).toBe(refs.reviewer.id);
    expect(approved.approvedAgencyId).toBe(refs.agency.id);
    expect(approved.createdAgencyUserId).toBe(refs.agencyUser.id);
  });

  it("returns InvalidAgencyRequestStatusTransition when transitioning a non-pending request", async () => {
    const request = await createAgencyRequest("APPROVED");
    const reviewer = await createUser("ADMIN");

    const result = await Effect.runPromise(repo.reject(request.id, {
      reviewedByUserId: reviewer.id,
      description: "Rejected after approval",
    }).pipe(Effect.either));

    const error = Either.isLeft(result) ? result.left : null;
    expectLeftTag(result, "InvalidAgencyRequestStatusTransition");
    if (!error || error._tag !== "InvalidAgencyRequestStatusTransition") {
      throw new Error("Expected InvalidAgencyRequestStatusTransition");
    }
    expect(error.currentStatus).toBe("APPROVED");
    expect(error.nextStatus).toBe("REJECTED");
  });

  it("returns AgencyRequestNotFound when approving an unknown request", async () => {
    const refs = await createApprovalRefs();

    const result = await Effect.runPromise(repo.approve(uuidv7(), {
      reviewedByUserId: refs.reviewer.id,
      approvedAgencyId: refs.agency.id,
      createdAgencyUserId: refs.agencyUser.id,
    }).pipe(Effect.either));

    expectLeftTag(result, "AgencyRequestNotFound");
  });
});
