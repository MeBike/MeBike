import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { migrate } from "@/test/db/migrate";
import { startPostgres } from "@/test/db/postgres";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { PrismaClient } from "generated/prisma/client";

import { makeRatingRepository } from "../rating.repository";

describe("ratingRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeRatingRepository>;

  beforeAll(async () => {
    container = await startPostgres();
    await migrate(container.url);

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    repo = makeRatingRepository(client);
  }, 60000);

  afterEach(async () => {
    await client.ratingReasonLink.deleteMany({});
    await client.rating.deleteMany({});
    await client.ratingReason.deleteMany({});
    await client.rental.deleteMany({});
    await client.bike.deleteMany({});
    await client.station.deleteMany({});
    await client.user.deleteMany({});
  });

  afterAll(async () => {
    if (client)
      await client.$disconnect();
    if (container)
      await container.stop();
  });

  const createUser = async () => {
    const id = uuidv7();
    await client.user.create({
      data: {
        id,
        fullname: "Rating User",
        email: `user-${id}@example.com`,
        passwordHash: "hash",
        role: "USER",
        verify: "VERIFIED",
      },
    });
    return { id };
  };

  const createStation = async () => {
    const id = uuidv7();
    const name = `Station ${id}`;
    const address = "123 Test St";
    const capacity = 10;
    const latitude = 10.762622;
    const longitude = 106.660172;
    const updatedAt = new Date();

    await client.$executeRaw`
      INSERT INTO "Station" (
        "id",
        "name",
        "address",
        "capacity",
        "latitude",
        "longitude",
        "updated_at",
        "position"
      ) VALUES (
        ${id},
        ${name},
        ${address},
        ${capacity},
        ${latitude},
        ${longitude},
        ${updatedAt},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      )
    `;

    return { id };
  };

  const createBike = async (stationId: string) => {
    const id = uuidv7();
    await client.bike.create({
      data: {
        id,
        chipId: `chip-${id}`,
        stationId,
        supplierId: null,
        status: "AVAILABLE",
        updatedAt: new Date(),
      },
    });
    return { id };
  };

  const createRental = async (userId: string, bikeId: string, stationId: string) => {
    const id = uuidv7();
    await client.rental.create({
      data: {
        id,
        userId,
        bikeId,
        startStationId: stationId,
        startTime: new Date(),
        status: "COMPLETED",
        updatedAt: new Date(),
      },
    });
    return { id };
  };

  const createReason = async () => {
    const id = uuidv7();
    await client.ratingReason.create({
      data: {
        id,
        type: "ISSUE",
        appliesTo: "bike",
        messages: `Reason ${id}`,
      },
    });
    return { id };
  };

  const expectLeftTag = <E extends { _tag: string }>(
    result: Either.Either<unknown, E>,
    tag: E["_tag"],
  ) => {
    if (Either.isRight(result)) {
      throw new Error(`Expected Left ${tag}, got Right`);
    }
    expect(result.left._tag).toBe(tag);
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
    const brokenRepo = makeRatingRepository(broken.client);

    const result = await Effect.runPromise(
      brokenRepo.findByRentalId(uuidv7()).pipe(Effect.either),
    );

    expectLeftTag(result, "RatingRepositoryError");

    await broken.stop();
  });
});
