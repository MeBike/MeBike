import { Effect, Either } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeRatingReasonRepository } from "../rating-reason.repository";

describe("ratingReasonRepository Integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeRatingReasonRepository>;

  beforeAll(() => {
    repo = makeRatingReasonRepository(fixture.prisma);
  });

  const createReason = async (type: "ISSUE" | "COMPLIMENT") => {
    const id = uuidv7();
    await fixture.prisma.ratingReason.create({
      data: {
        id,
        type,
        appliesTo: "bike",
        message: `Reason ${id}`,
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
    try {
      const brokenRepo = makeRatingReasonRepository(broken.client);

      const result = await Effect.runPromise(
        brokenRepo.findManyByIds([uuidv7()]).pipe(Effect.either),
      );

      if (Either.isRight(result)) {
        throw new Error("Expected failure but got success");
      }
      expect(result.left._tag).toBe("RatingRepositoryError");
    }
    finally {
      await broken.stop();
    }
  });
});
