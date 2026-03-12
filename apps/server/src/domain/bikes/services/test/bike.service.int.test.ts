import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either, Layer } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { BikeRepository } from "@/domain/bikes/repository/bike.repository";
import { Prisma } from "@/infrastructure/prisma";
import { getTestDatabase } from "@/test/db/test-database";
import { PrismaClient } from "generated/prisma/client";

import { bikeRepositoryFactory } from "../../repository/bike.repository";
import { BikeServiceLive, BikeServiceTag } from "../bike.service";

describe("bikeService Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let depsLayer: Layer.Layer<BikeServiceTag | BikeRepository | Prisma>;

  beforeAll(async () => {
    container = await getTestDatabase();

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });

    const bikeRepoLayer = Layer.succeed(
      BikeRepository,
      BikeRepository.make(bikeRepositoryFactory(client)),
    );
    const bikeServiceLayer = BikeServiceLive.pipe(
      Layer.provide(bikeRepoLayer),
      Layer.provide(Layer.succeed(Prisma, Prisma.make({ client }))),
    );

    depsLayer = Layer.mergeAll(
      Layer.succeed(Prisma, Prisma.make({ client })),
      bikeRepoLayer,
      bikeServiceLayer,
    );
  }, 60000);

  afterEach(async () => {
    await client.bike.deleteMany({});
    await client.station.deleteMany({});
    await client.supplier.deleteMany({});
  });

  afterAll(async () => {
    if (client)
      await client.$disconnect();
    if (container)
      await container.stop();
  });

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

  const createSupplier = async () => {
    const id = uuidv7();
    await client.supplier.create({
      data: {
        id,
        name: `Supplier ${id}`,
        address: "123 Supplier St",
        phoneNumber: "0900000000",
        contractFee: "10.00",
        status: "ACTIVE",
        updatedAt: new Date(),
      },
    });
    return { id };
  };

  const createBike = async (
    stationId: string,
    supplierId: string,
    chipId = `chip-${uuidv7()}`,
  ) => {
    const id = uuidv7();
    await client.bike.create({
      data: {
        id,
        chipId,
        stationId,
        supplierId,
        status: "AVAILABLE",
        updatedAt: new Date(),
      },
      select: { id: true, chipId: true },
    });

    return { id, chipId };
  };

  const runWithService = <A, E>(
    eff: Effect.Effect<A, E, BikeServiceTag>,
  ) =>
    Effect.runPromise(eff.pipe(Effect.provide(depsLayer)));

  it("fails with BikeStationNotFound when station does not exist", async () => {
    const { id: supplierId } = await createSupplier();

    const result = await runWithService(
      Effect.flatMap(BikeServiceTag, service =>
        service.createBike({
          chipId: `chip-${uuidv7()}`,
          stationId: uuidv7(),
          supplierId,
          status: "AVAILABLE",
        })).pipe(Effect.either),
    );

    if (Either.isRight(result)) {
      throw new Error("Expected BikeStationNotFound failure");
    }
    expect(result.left._tag).toBe("BikeStationNotFound");
  });

  it("fails with BikeSupplierNotFound when supplier does not exist", async () => {
    const { id: stationId } = await createStation();

    const result = await runWithService(
      Effect.flatMap(BikeServiceTag, service =>
        service.createBike({
          chipId: `chip-${uuidv7()}`,
          stationId,
          supplierId: uuidv7(),
          status: "AVAILABLE",
        })).pipe(Effect.either),
    );

    if (Either.isRight(result)) {
      throw new Error("Expected BikeSupplierNotFound failure");
    }
    expect(result.left._tag).toBe("BikeSupplierNotFound");
  });

  it("creates bike when station and supplier both exist", async () => {
    const { id: stationId } = await createStation();
    const { id: supplierId } = await createSupplier();

    const created = await runWithService(
      Effect.flatMap(BikeServiceTag, service =>
        service.createBike({
          chipId: `chip-${uuidv7()}`,
          stationId,
          supplierId,
          status: "AVAILABLE",
        })),
    );

    expect(created.stationId).toBe(stationId);
    expect(created.supplierId).toBe(supplierId);
    expect(created.status).toBe("AVAILABLE");
  });

  it("update fails with BikeStationNotFound when station does not exist", async () => {
    const { id: stationId } = await createStation();
    const { id: supplierId } = await createSupplier();
    const { id: bikeId } = await createBike(stationId, supplierId);

    const result = await runWithService(
      Effect.flatMap(BikeServiceTag, service =>
        service.adminUpdateBike(bikeId, {
          stationId: uuidv7(),
        })).pipe(Effect.either),
    );

    if (Either.isRight(result)) {
      throw new Error("Expected BikeStationNotFound failure");
    }
    expect(result.left._tag).toBe("BikeStationNotFound");
  });

  it("update fails with BikeSupplierNotFound when supplier does not exist", async () => {
    const { id: stationId } = await createStation();
    const { id: supplierId } = await createSupplier();
    const { id: bikeId } = await createBike(stationId, supplierId);

    const result = await runWithService(
      Effect.flatMap(BikeServiceTag, service =>
        service.adminUpdateBike(bikeId, {
          supplierId: uuidv7(),
        })).pipe(Effect.either),
    );

    if (Either.isRight(result)) {
      throw new Error("Expected BikeSupplierNotFound failure");
    }
    expect(result.left._tag).toBe("BikeSupplierNotFound");
  });

  it("update fails with DuplicateChipId when chipId already exists", async () => {
    const { id: stationId } = await createStation();
    const { id: supplierId } = await createSupplier();
    const primaryBike = await createBike(stationId, supplierId);
    const existingBike = await createBike(stationId, supplierId);

    const result = await runWithService(
      Effect.flatMap(BikeServiceTag, service =>
        service.adminUpdateBike(primaryBike.id, {
          chipId: existingBike.chipId,
        })).pipe(Effect.either),
    );

    if (Either.isRight(result)) {
      throw new Error("Expected DuplicateChipId failure");
    }
    expect(result.left._tag).toBe("DuplicateChipId");
  });
});
