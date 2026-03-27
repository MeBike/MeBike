import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectLeftTag } from "@/test/effect/assertions";

import { setupRatingRepositoryIntTestKit } from "../rating.repository.int.test-kit";

describe("ratingRepository read integration", () => {
  const kit = setupRatingRepositoryIntTestKit();
  let repo: ReturnType<typeof kit.makeRepo>;

  beforeAll(() => {
    repo = kit.makeRepo();
  });

  it("returns RatingRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    try {
      const brokenRepo = kit.makeRepo(broken.client);

      const result = await Effect.runPromise(
        brokenRepo.findByRentalId(uuidv7()).pipe(Effect.either),
      );

      expectLeftTag(result, "RatingRepositoryError");
    }
    finally {
      await broken.stop();
    }
  });

  it("findBikeSummary returns average, total, and breakdown", async () => {
    const { id: userId } = await kit.createUser();
    const { id: stationId } = await kit.createStation();
    const { id: bikeId } = await kit.createBike(stationId);
    const { id: otherBikeId } = await kit.createBike(stationId);
    const reason = await kit.createReason();

    const rentalOne = await kit.createRental(userId, bikeId, stationId);
    const rentalTwo = await kit.createRental(userId, bikeId, stationId);
    const rentalOther = await kit.createRental(userId, otherBikeId, stationId);

    await Effect.runPromise(repo.createRating({
      userId,
      rentalId: rentalOne.id,
      bikeId,
      stationId,
      bikeScore: 5,
      stationScore: 4,
      reasonIds: [reason.id],
    }));

    await Effect.runPromise(repo.createRating({
      userId,
      rentalId: rentalTwo.id,
      bikeId,
      stationId,
      bikeScore: 3,
      stationScore: 2,
      reasonIds: [reason.id],
    }));

    await Effect.runPromise(repo.createRating({
      userId,
      rentalId: rentalOther.id,
      bikeId: otherBikeId,
      stationId,
      bikeScore: 1,
      stationScore: 1,
      reasonIds: [reason.id],
    }));

    const summary = await Effect.runPromise(repo.findBikeSummary(bikeId));

    expect(summary.averageRating).toBe(4);
    expect(summary.totalRatings).toBe(2);
    expect(summary.breakdown).toEqual({
      oneStar: 0,
      twoStar: 0,
      threeStar: 1,
      fourStar: 0,
      fiveStar: 1,
    });
  });

  it("findStationSummary returns zeroed summary when no ratings", async () => {
    const { id: stationId } = await kit.createStation();

    const summary = await Effect.runPromise(repo.findStationSummary(stationId));

    expect(summary.averageRating).toBe(0);
    expect(summary.totalRatings).toBe(0);
    expect(summary.breakdown).toEqual({
      oneStar: 0,
      twoStar: 0,
      threeStar: 0,
      fourStar: 0,
      fiveStar: 0,
    });
  });
});
