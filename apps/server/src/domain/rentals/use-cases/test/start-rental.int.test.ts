import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either, Layer } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { BikeRepository, makeBikeRepository } from "@/domain/bikes";
import { makeRentalRepository, RentalRepository } from "@/domain/rentals";
import { startRentalUseCase } from "@/domain/rentals/use-cases/rental.use-cases";
import { makeWalletRepository, WalletRepository } from "@/domain/wallets";
import { Prisma } from "@/infrastructure/prisma";
import logger from "@/lib/logger";
import { migrate } from "@/test/db/migrate";
import { startPostgres } from "@/test/db/postgres";
import { PrismaClient } from "generated/prisma/client";

type TestContainer = { stop: () => Promise<void>; url: string };

describe("startRentalUseCase Integration", () => {
  let container: TestContainer;
  let client: PrismaClient;
  let rentalRepo: ReturnType<typeof makeRentalRepository>;
  let bikeRepo: ReturnType<typeof makeBikeRepository>;
  let walletRepo: ReturnType<typeof makeWalletRepository>;
  let depsLayer: Layer.Layer<
    Prisma | RentalRepository | BikeRepository | WalletRepository
  >;

  beforeAll(async () => {
    container = await startPostgres();
    await migrate(container.url);

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });

    rentalRepo = makeRentalRepository(client);
    bikeRepo = makeBikeRepository(client);
    walletRepo = makeWalletRepository(client);

    depsLayer = Layer.mergeAll(
      Layer.succeed(Prisma, Prisma.make({ client })),
      Layer.succeed(RentalRepository, rentalRepo),
      Layer.succeed(BikeRepository, bikeRepo),
      Layer.succeed(WalletRepository, walletRepo),
    );
  }, 60000);
  afterEach(async () => {
    await client.rental.deleteMany({});
    await client.walletTransaction.deleteMany({});
    await client.wallet.deleteMany({});
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

  const provideDeps = <A, E>(
    eff: Effect.Effect<
      A,
      E,
      Prisma | RentalRepository | BikeRepository | WalletRepository
    >,
  ) => eff.pipe(Effect.provide(depsLayer));

  const createUser = async () => {
    const id = uuidv7();
    await client.user.create({
      data: {
        id,
        fullname: "Test User",
        email: `user-${id}@example.com`,
        passwordHash: "hash",
        role: "USER",
        verify: "VERIFIED",
      },
    });
    return { id };
  };

  const createStation = async (
    overrides?: Partial<{ id: string; name: string }>,
  ) => {
    const id = overrides?.id ?? uuidv7();
    const name = overrides?.name ?? `Station ${id}`;
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

  const createBike = async (input: {
    stationId: string | null;
    status?:
      | "AVAILABLE"
      | "BOOKED"
      | "BROKEN"
      | "MAINTAINED"
      | "RESERVED"
      | "UNAVAILABLE";
  }) => {
    const id = uuidv7();
    await client.bike.create({
      data: {
        id,
        chipId: `chip-${id}`,
        stationId: input.stationId,
        supplierId: null,
        status: input.status ?? "AVAILABLE",
        updatedAt: new Date(),
      },
    });
    return { id };
  };

  const createWallet = async (userId: string, balance: string) => {
    await client.wallet.create({
      data: {
        userId,
        balance,
        status: "ACTIVE",
      },
    });
  };

  const createActiveRental = async (args: {
    userId: string;
    bikeId: string;
    startStationId: string;
  }) => {
    await client.rental.create({
      data: {
        userId: args.userId,
        bikeId: args.bikeId,
        startStationId: args.startStationId,
        startTime: new Date(),
        status: "RENTED",
        updatedAt: new Date(),
      },
    });
  };

  const runStartRental = (args: {
    userId: string;
    bikeId: string;
    startStationId: string;
  }) =>
    Effect.runPromise(
      provideDeps(
        startRentalUseCase({
          userId: args.userId,
          bikeId: args.bikeId,
          startStationId: args.startStationId,
          startTime: new Date(),
        }).pipe(Effect.either),
      ),
    );

  const expectLeftTag = <E extends { _tag: string }>(
    result: Either.Either<unknown, E>,
    tag: E["_tag"],
  ) => {
    if (Either.isRight(result)) {
      throw new Error(`Expected Left ${tag}, got Right`);
    }
    expect(result.left._tag).toBe(tag);
  };

  it("creates a rental and books the bike", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });
    await createWallet(userId, "5000");

    const result = await runStartRental({
      userId,
      bikeId,
      startStationId: stationId,
    });

    if (Either.isLeft(result)) {
      throw new Error(`Expected Right, got ${result.left._tag}`);
    }

    expect(result.right.status).toBe("RENTED");
    expect(result.right.userId).toBe(userId);
    expect(result.right.bikeId).toBe(bikeId);

    const bike = await client.bike.findUnique({ where: { id: bikeId } });
    expect(bike?.status).toBe("BOOKED");
  });

  it("fails when user already has an active rental", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });
    await createWallet(userId, "5000");
    await createActiveRental({ userId, bikeId, startStationId: stationId });

    const result = await runStartRental({
      userId,
      bikeId,
      startStationId: stationId,
    });
    expectLeftTag(result, "ActiveRentalExists");
  });

  it("fails when bike already rented by someone else", async () => {
    const { id: userId } = await createUser();
    const { id: otherUserId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });
    await createWallet(userId, "5000");
    await createWallet(otherUserId, "5000");
    await createActiveRental({
      userId: otherUserId,
      bikeId,
      startStationId: stationId,
    });

    const result = await runStartRental({
      userId,
      bikeId,
      startStationId: stationId,
    });
    expectLeftTag(result, "BikeAlreadyRented");
  });

  it("fails when bike is missing", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    await createWallet(userId, "5000");

    const result = await runStartRental({
      userId,
      bikeId: uuidv7(),
      startStationId: stationId,
    });
    expectLeftTag(result, "BikeNotFound");
  });

  it("fails when bike has no station", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId: null });
    await createWallet(userId, "5000");

    const result = await runStartRental({
      userId,
      bikeId,
      startStationId: stationId,
    });
    expectLeftTag(result, "BikeMissingStation");
  });

  it("fails when bike is in a different station", async () => {
    const { id: userId } = await createUser();
    const { id: startStationId } = await createStation();
    const { id: otherStationId } = await createStation({
      name: `Station ${uuidv7()}`,
    });
    const { id: bikeId } = await createBike({ stationId: otherStationId });
    await createWallet(userId, "5000");

    const result = await runStartRental({ userId, bikeId, startStationId });
    expectLeftTag(result, "BikeNotFoundInStation");
  });

  it.each([
    { status: "BOOKED", tag: "BikeAlreadyRented" },
    { status: "BROKEN", tag: "BikeIsBroken" },
    { status: "MAINTAINED", tag: "BikeIsMaintained" },
    { status: "RESERVED", tag: "BikeIsReserved" },
    { status: "UNAVAILABLE", tag: "BikeUnavailable" },
  ] as const)("fails when bike status is $status", async ({ status, tag }) => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId, status });
    await createWallet(userId, "5000");

    const result = await runStartRental({
      userId,
      bikeId,
      startStationId: stationId,
    });
    expectLeftTag(result, tag);
  });

  it("fails when user wallet is missing", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });

    const result = await runStartRental({
      userId,
      bikeId,
      startStationId: stationId,
    });
    expectLeftTag(result, "UserWalletNotFound");
  });

  it("fails when wallet balance is insufficient", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });
    await createWallet(userId, "1000");

    const result = await runStartRental({
      userId,
      bikeId,
      startStationId: stationId,
    });
    expectLeftTag(result, "InsufficientBalanceToRent");
  });

  it("emits RentalUniqueViolation on duplicate active rentals (repo)", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });

    const byBike = await client.$transaction(async (tx) => {
      const first = await Effect.runPromise(
        rentalRepo.createRentalInTx(tx, {
          userId,
          bikeId,
          startStationId: stationId,
          startTime: new Date(),
        }).pipe(Effect.either),
      );

      if (Either.isLeft(first)) {
        throw new Error(`Expected first create to succeed, got ${first.left._tag}`);
      }

      return Effect.runPromise(
        rentalRepo.createRentalInTx(tx, {
          userId: uuidv7(),
          bikeId,
          startStationId: stationId,
          startTime: new Date(),
        }).pipe(Effect.either),
      );
    });

    if (Either.isRight(byBike)) {
      throw new Error("Expected unique violation by bike, got Right");
    }
    logger.info(
      { error: byBike.left, cause: (byBike.left as { cause?: unknown }).cause },
      "RentalUniqueViolation (by bike) shape",
    );
    expect(byBike.left._tag).toBe("RentalUniqueViolation");

    const bike2Id = (await createBike({ stationId })).id;
    const byUser = await client.$transaction(async tx =>
      Effect.runPromise(
        Effect.all([
          rentalRepo.createRentalInTx(tx, {
            userId,
            bikeId: bike2Id,
            startStationId: stationId,
            startTime: new Date(),
          }),
          rentalRepo.createRentalInTx(tx, {
            userId,
            bikeId: uuidv7(),
            startStationId: stationId,
            startTime: new Date(),
          }),
        ]).pipe(Effect.either),
      ));

    if (Either.isRight(byUser)) {
      throw new Error("Expected unique violation by user, got Right");
    }
    logger.info(
      { error: byUser.left, cause: (byUser.left as { cause?: unknown }).cause },
      "RentalUniqueViolation (by user) shape",
    );
    expect(byUser.left._tag).toBe("RentalUniqueViolation");
  });
});
