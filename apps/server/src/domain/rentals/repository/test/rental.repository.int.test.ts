import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { migrate } from "@/test/db/migrate";
import { startPostgres } from "@/test/db/postgres";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { PrismaClient } from "generated/prisma/client";

import { makeRentalRepository } from "../rental.repository";

describe("rentalRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeRentalRepository>;

  beforeAll(async () => {
    container = await startPostgres();
    await migrate(container.url);

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    repo = makeRentalRepository(client);
  }, 60000);

  afterEach(async () => {
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
        fullname: "Rental User",
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

  const expectLeftTag = <E extends { _tag: string }>(
    result: Either.Either<unknown, E>,
    tag: E["_tag"],
  ) => {
    if (Either.isRight(result)) {
      throw new Error(`Expected Left ${tag}, got Right`);
    }
    expect(result.left._tag).toBe(tag);
  };

  it("createRental stores an active rental", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId);

    const rental = await Effect.runPromise(
      repo.createRental({
        userId,
        bikeId,
        startStationId: stationId,
        startTime: new Date(),
      }),
    );

    expect(rental.status).toBe("RENTED");
    expect(rental.userId).toBe(userId);

    const active = await Effect.runPromise(repo.findActiveByUserId(userId));
    if (Option.isNone(active)) {
      throw new Error("Expected active rental");
    }
    expect(active.value.id).toBe(rental.id);

    const list = await Effect.runPromise(
      repo.listMyCurrentRentals(userId, { page: 1, pageSize: 10 }),
    );
    expect(list.items).toHaveLength(1);
  });

  it("updateRentalOnEnd marks rental completed", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId);

    const rental = await Effect.runPromise(
      repo.createRental({
        userId,
        bikeId,
        startStationId: stationId,
        startTime: new Date(),
      }),
    );

    const updated = await Effect.runPromise(
      repo.updateRentalOnEnd({
        rentalId: rental.id,
        endStationId: stationId,
        endTime: new Date(),
        durationMinutes: 15,
        totalPrice: 1000,
        newStatus: "COMPLETED",
      }),
    );

    expect(updated.status).toBe("COMPLETED");
    expect(updated.totalPrice).toBe(1000);

    const found = await Effect.runPromise(repo.findById(rental.id));
    if (Option.isNone(found)) {
      throw new Error("Expected rental to exist");
    }
    expect(found.value.status).toBe("COMPLETED");
  });

  it("createRental rejects active rental duplicates", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId);
    const { id: otherBikeId } = await createBike(stationId);

    await Effect.runPromise(
      repo.createRental({
        userId,
        bikeId,
        startStationId: stationId,
        startTime: new Date(),
      }),
    );

    const result = await Effect.runPromise(
      repo
        .createRental({
          userId,
          bikeId: otherBikeId,
          startStationId: stationId,
          startTime: new Date(),
        })
        .pipe(Effect.either),
    );

    expectLeftTag(result, "RentalUniqueViolation");
  });

  it("returns RentalRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    const brokenRepo = makeRentalRepository(broken.client);

    const result = await Effect.runPromise(
      brokenRepo.findById(uuidv7()).pipe(Effect.either),
    );

    expectLeftTag(result, "RentalRepositoryError");

    await broken.stop();
  });
});
