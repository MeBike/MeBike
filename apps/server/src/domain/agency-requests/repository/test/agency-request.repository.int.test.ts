import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getTestDatabase } from "@/test/db/test-database";
import { PrismaClient } from "generated/prisma/client";

import { makeAgencyRequestRepository } from "../agency-request.repository";

describe("agencyRequestRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeAgencyRequestRepository>;

  beforeAll(async () => {
    container = await getTestDatabase();

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    repo = makeAgencyRequestRepository(client);
  }, 60000);

  afterEach(async () => {
    await client.agencyRequest.deleteMany({});
    await client.userOrgAssignment.deleteMany({});
    await client.agency.deleteMany({});
    await client.user.deleteMany({});
  });

  afterAll(async () => {
    if (client) {
      await client.$disconnect();
    }

    if (container) {
      await container.stop();
    }
  });

  async function createUser(role: "USER" | "ADMIN" | "AGENCY" = "USER") {
    const id = uuidv7();
    await client.user.create({
      data: {
        id,
        fullname: `${role} User`,
        email: `${role.toLowerCase()}-${id}@example.com`,
        passwordHash: "hash",
        role,
        verify: "VERIFIED",
      },
    });

    return { id };
  }

  async function createAgencyRequest(status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" = "PENDING") {
    const requester = await createUser("USER");

    return client.agencyRequest.create({
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
    const agency = await client.agency.create({
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

    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.status).toBe("APPROVED");
      expect(result.right.reviewedByUserId).toBe(refs.reviewer.id);
      expect(result.right.approvedAgencyId).toBe(refs.agency.id);
      expect(result.right.createdAgencyUserId).toBe(refs.agencyUser.id);
    }
  });

  it("returns InvalidAgencyRequestStatusTransition when transitioning a non-pending request", async () => {
    const request = await createAgencyRequest("APPROVED");
    const reviewer = await createUser("ADMIN");

    const result = await Effect.runPromise(repo.reject(request.id, {
      reviewedByUserId: reviewer.id,
      description: "Rejected after approval",
    }).pipe(Effect.either));

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("InvalidAgencyRequestStatusTransition");
      if (result.left._tag === "InvalidAgencyRequestStatusTransition") {
        expect(result.left.currentStatus).toBe("APPROVED");
        expect(result.left.nextStatus).toBe("REJECTED");
      }
    }
  });

  it("returns AgencyRequestNotFound when approving an unknown request", async () => {
    const refs = await createApprovalRefs();

    const result = await Effect.runPromise(repo.approve(uuidv7(), {
      reviewedByUserId: refs.reviewer.id,
      approvedAgencyId: refs.agency.id,
      createdAgencyUserId: refs.agencyUser.id,
    }).pipe(Effect.either));

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("AgencyRequestNotFound");
    }
  });
});
