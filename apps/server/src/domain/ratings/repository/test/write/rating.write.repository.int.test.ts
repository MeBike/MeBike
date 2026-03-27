import { Effect, Option } from "effect";
import { beforeAll, describe, expect, it } from "vitest";

import { expectLeftTag } from "@/test/effect/assertions";

import { setupRatingRepositoryIntTestKit } from "../rating.repository.int.test-kit";

describe("ratingRepository write integration", () => {
  const kit = setupRatingRepositoryIntTestKit();
  let repo: ReturnType<typeof kit.makeRepo>;

  beforeAll(() => {
    repo = kit.makeRepo();
  });

  it("createRating persists rating and reasons", async () => {
    const { id: userId } = await kit.createUser();
    const { id: stationId } = await kit.createStation();
    const { id: bikeId } = await kit.createBike(stationId);
    const { id: rentalId } = await kit.createRental(userId, bikeId, stationId);
    const reason = await kit.createReason();

    const rating = await Effect.runPromise(
      repo.createRating({
        userId,
        rentalId,
        bikeId,
        stationId,
        bikeScore: 5,
        stationScore: 4,
        comment: "Great ride",
        reasonIds: [reason.id],
      }),
    );

    expect(rating.rentalId).toBe(rentalId);

    const found = await Effect.runPromise(repo.findByRentalId(rentalId));
    if (Option.isNone(found)) {
      throw new Error("Expected rating to exist");
    }
    expect(found.value.id).toBe(rating.id);
  });

  it("createRating rejects duplicate rental rating", async () => {
    const { id: userId } = await kit.createUser();
    const { id: stationId } = await kit.createStation();
    const { id: bikeId } = await kit.createBike(stationId);
    const { id: rentalId } = await kit.createRental(userId, bikeId, stationId);
    const reason = await kit.createReason();

    await Effect.runPromise(
      repo.createRating({
        userId,
        rentalId,
        bikeId,
        stationId,
        bikeScore: 4,
        stationScore: 4,
        reasonIds: [reason.id],
      }),
    );

    const result = await Effect.runPromise(
      repo
        .createRating({
          userId,
          rentalId,
          bikeId,
          stationId,
          bikeScore: 3,
          stationScore: 3,
          reasonIds: [reason.id],
        })
        .pipe(Effect.either),
    );

    expectLeftTag(result, "RatingAlreadyExists");
  });
});
