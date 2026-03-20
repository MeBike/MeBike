import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectLeftTag } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeRatingRepository } from "../rating.repository";

describe("ratingRepository Integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeRatingRepository>;

  beforeAll(() => {
    repo = makeRatingRepository(fixture.prisma);
  });

  const createUser = async () => {
    const user = await fixture.factories.user({ fullname: "Rating User" });
    return { id: user.id };
  };

  const createStation = async () => {
    const station = await fixture.factories.station();
    return { id: station.id };
  };

  const createBike = async (stationId: string) => {
    const bike = await fixture.factories.bike({ stationId, status: "AVAILABLE" });
    return { id: bike.id };
  };

  const createRental = async (userId: string, bikeId: string, stationId: string) => {
    const rental = await fixture.factories.rental({
      userId,
      bikeId,
      startStationId: stationId,
      status: "COMPLETED",
    });
    return { id: rental.id };
  };

  const createReason = async (appliesTo: "bike" | "station" = "bike") => {
    const id = uuidv7();
    await fixture.prisma.ratingReason.create({
      data: {
        id,
        type: "ISSUE",
        appliesTo,
        messages: `Reason ${id}`,
      },
    });
    return { id };
  };

  it("createRating persists rating and reasons", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId);
    const { id: rentalId } = await createRental(userId, bikeId, stationId);
    const reason = await createReason();

    const rating = await Effect.runPromise(
      repo.createRating({
        userId,
        rentalId,
        rating: 5,
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
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId);
    const { id: rentalId } = await createRental(userId, bikeId, stationId);
    const reason = await createReason();

    await Effect.runPromise(
      repo.createRating({
        userId,
        rentalId,
        rating: 4,
        reasonIds: [reason.id],
      }),
    );

    const result = await Effect.runPromise(
      repo
        .createRating({
          userId,
          rentalId,
          rating: 3,
          reasonIds: [reason.id],
        })
        .pipe(Effect.either),
    );

    expectLeftTag(result, "RatingAlreadyExists");
  });

  it("returns RatingRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    try {
      const brokenRepo = makeRatingRepository(broken.client);

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
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId);
    const { id: otherBikeId } = await createBike(stationId);
    const reason = await createReason();

    const rentalOne = await createRental(userId, bikeId, stationId);
    const rentalTwo = await createRental(userId, bikeId, stationId);
    const rentalOther = await createRental(userId, otherBikeId, stationId);

    await Effect.runPromise(repo.createRating({
      userId,
      rentalId: rentalOne.id,
      rating: 5,
      reasonIds: [reason.id],
    }));

    await Effect.runPromise(repo.createRating({
      userId,
      rentalId: rentalTwo.id,
      rating: 3,
      reasonIds: [reason.id],
    }));

    await Effect.runPromise(repo.createRating({
      userId,
      rentalId: rentalOther.id,
      rating: 1,
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
    const { id: stationId } = await createStation();

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
