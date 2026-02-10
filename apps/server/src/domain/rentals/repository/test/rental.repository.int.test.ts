import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getTestDatabase } from "@/test/db/test-database";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { PrismaClient } from "generated/prisma/client";

import { makeRentalRepository } from "../rental.repository";

describe("rentalRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeRentalRepository>;

  beforeAll(async () => {
    container = await getTestDatabase();

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

  const createUser = async (options?: { phoneNumber?: string; fullname?: string }) => {
    const id = uuidv7();
    await client.user.create({
      data: {
        id,
        fullname: options?.fullname ?? "Rental User",
        email: `user-${id}@example.com`,
        phoneNumber: options?.phoneNumber,
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

  it("createReservedRentalForReservationInTx stores a reserved rental with reservationId", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId);
    const reservationId = uuidv7();
    const startTime = new Date();

    const reserved = await client.$transaction(async (tx) => {
      const txRepo = makeRentalRepository(tx);
      return Effect.runPromise(
        txRepo.createReservedRentalForReservation({
          reservationId,
          userId,
          bikeId,
          startStationId: stationId,
          startTime,
          subscriptionId: null,
        }),
      );
    });

    expect(reserved.id).toBe(reservationId);
    expect(reserved.status).toBe("RESERVED");

    const found = await Effect.runPromise(repo.findById(reservationId));
    if (Option.isNone(found)) {
      throw new Error("Expected reserved rental to exist");
    }
    expect(found.value.status).toBe("RESERVED");
  });

  it("startReservedRentalInTx marks reserved rental as rented", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId);
    const reservationId = uuidv7();
    const reservedAt = new Date();
    const startTime = new Date();

    const started = await client.$transaction(async tx =>
      Effect.runPromise(
        Effect.gen(function* () {
          const txRepo = makeRentalRepository(tx);

          yield* txRepo.createReservedRentalForReservation({
            reservationId,
            userId,
            bikeId,
            startStationId: stationId,
            startTime: reservedAt,
            subscriptionId: null,
          });

          return yield* txRepo.startReservedRental(
            reservationId,
            startTime,
            startTime,
            null,
          );
        }),
      ),
    );

    expect(started).toBe(true);

    const found = await Effect.runPromise(repo.findById(reservationId));
    if (Option.isNone(found)) {
      throw new Error("Expected rental to exist");
    }
    expect(found.value.status).toBe("RENTED");
    expect(found.value.startTime.getTime()).toBe(startTime.getTime());
  });

  it("cancelReservedRentalInTx marks reserved rental as cancelled", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId);
    const reservationId = uuidv7();
    const reservedAt = new Date();
    const cancelledAt = new Date();

    const cancelled = await client.$transaction(async tx =>
      Effect.runPromise(
        Effect.gen(function* () {
          const txRepo = makeRentalRepository(tx);

          yield* txRepo.createReservedRentalForReservation({
            reservationId,
            userId,
            bikeId,
            startStationId: stationId,
            startTime: reservedAt,
            subscriptionId: null,
          });

          return yield* txRepo.cancelReservedRental(reservationId, cancelledAt);
        }),
      ),
    );

    expect(cancelled).toBe(true);

    const found = await Effect.runPromise(repo.findById(reservationId));
    if (Option.isNone(found)) {
      throw new Error("Expected rental to exist");
    }
    expect(found.value.status).toBe("CANCELLED");
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

    if (Option.isNone(updated)) {
      throw new Error("Expected rental to be updated");
    }
    expect(updated.value.status).toBe("COMPLETED");
    expect(updated.value.totalPrice).toBe(1000);

    const found = await Effect.runPromise(repo.findById(rental.id));
    if (Option.isNone(found)) {
      throw new Error("Expected rental to exist");
    }
    expect(found.value.status).toBe("COMPLETED");
  });

  it("adminListRentals returns filtered results with user summary", async () => {
    const { id: userId } = await createUser();
    const { id: otherUserId } = await createUser();
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

    await Effect.runPromise(
      repo.createRental({
        userId: otherUserId,
        bikeId: otherBikeId,
        startStationId: stationId,
        startTime: new Date(),
      }),
    );

    const page = await Effect.runPromise(
      repo.adminListRentals({ userId }, {
        page: 1,
        pageSize: 10,
        sortBy: "startTime",
        sortDir: "desc",
      }),
    );

    expect(page.items).toHaveLength(1);
    expect(page.items[0].user.id).toBe(userId);
  });

  it("adminGetRentalById returns detailed rental data", async () => {
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

    const detailOpt = await Effect.runPromise(
      repo.adminGetRentalById(rental.id),
    );

    if (Option.isNone(detailOpt)) {
      throw new Error("Expected rental detail");
    }

    expect(detailOpt.value.id).toBe(rental.id);
    expect(detailOpt.value.user.id).toBe(userId);
    expect(detailOpt.value.user.email).toContain("@example.com");
    expect(detailOpt.value.bike?.id).toBe(bikeId);
    expect(detailOpt.value.startStation.id).toBe(stationId);
  });

  it("listActiveRentalsByPhone returns active rentals for user phone", async () => {
    const phoneNumber = "0901234567";
    const { id: userId } = await createUser({ phoneNumber, fullname: "Phone User" });
    const { id: otherUserId } = await createUser({ phoneNumber: "0909999999" });
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId);
    const { id: bikeIdTwo } = await createBike(stationId);
    const { id: otherBikeId } = await createBike(stationId);

    const rentalToComplete = await Effect.runPromise(
      repo.createRental({
        userId,
        bikeId,
        startStationId: stationId,
        startTime: new Date(),
      }),
    );

    await Effect.runPromise(
      repo.updateRentalOnEnd({
        rentalId: rentalToComplete.id,
        endStationId: stationId,
        endTime: new Date(),
        durationMinutes: 10,
        totalPrice: 500,
        newStatus: "COMPLETED",
      }),
    );

    const rental = await Effect.runPromise(
      repo.createRental({
        userId,
        bikeId: bikeIdTwo,
        startStationId: stationId,
        startTime: new Date(),
      }),
    );

    await Effect.runPromise(
      repo.createRental({
        userId: otherUserId,
        bikeId: otherBikeId,
        startStationId: stationId,
        startTime: new Date(),
      }),
    );

    const page = await Effect.runPromise(
      repo.listActiveRentalsByPhone(phoneNumber, {
        page: 1,
        pageSize: 10,
        sortBy: "startTime",
        sortDir: "desc",
      }),
    );

    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe(rental.id);
    expect(page.items[0].user.id).toBe(userId);
    expect(page.items[0].status).toBe("RENTED");
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
