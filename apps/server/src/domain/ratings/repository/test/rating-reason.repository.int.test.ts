import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";


import { getTestDatabase } from "@/test/db/test-database";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { PrismaClient } from "generated/prisma/client";

import { makeRatingReasonRepository } from "../rating-reason.repository";

describe("ratingReasonRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeRatingReasonRepository>;

  beforeAll(async () => {
    container = await getTestDatabase();
    

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    repo = makeRatingReasonRepository(client);
  }, 60000);

  afterEach(async () => {
    await client.ratingReasonLink.deleteMany({});
    await client.ratingReason.deleteMany({});
  });

  afterAll(async () => {
    if (client)
      await client.$disconnect();
    if (container)
      await container.stop();
  });

  const createReason = async (type: "ISSUE" | "COMPLIMENT") => {
    const id = uuidv7();
    await client.ratingReason.create({
      data: {
        id,
        type,
        appliesTo: "bike",
        messages: `Reason ${id}`,
      },
    });
    return { id };
  };

  it("findManyByIds returns matching reasons", async () => {
    const reasonA = await createReason("ISSUE");
    const reasonB = await createReason("COMPLIMENT");

    const result = await Effect.runPromise(
      repo.findManyByIds([reasonA.id, reasonB.id]),
    );

    expect(result).toHaveLength(2);
    expect(result.map(r => r.id).sort()).toEqual([reasonA.id, reasonB.id].sort());
  });

  it("findManyByIds returns empty array when none match", async () => {
    const result = await Effect.runPromise(
      repo.findManyByIds([uuidv7()]),
    );

    expect(result).toHaveLength(0);
  });

  it("returns RatingRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    const brokenRepo = makeRatingReasonRepository(broken.client);

    const result = await Effect.runPromise(
      brokenRepo.findManyByIds([uuidv7()]).pipe(Effect.either),
    );

    if (Either.isRight(result)) {
      throw new Error("Expected failure but got success");
    }
    expect(result.left._tag).toBe("RatingRepositoryError");

    await broken.stop();
  });
});
