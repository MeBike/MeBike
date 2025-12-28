import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { migrate } from "@/test/db/migrate";
import { startPostgres } from "@/test/db/postgres";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { PrismaClient } from "generated/prisma/client";

import { makeBikeRepository } from "../bike.repository";

describe("bikeRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeBikeRepository>;

  beforeAll(async () => {
    container = await startPostgres();
    await migrate(container.url);

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    repo = makeBikeRepository(client);
  }, 60000);

  afterEach(async () => {
    await client.bike.deleteMany({});
    await client.station.deleteMany({});
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

  const createBike = async (
    stationId: string,
    status: "AVAILABLE" | "BOOKED" | "RESERVED" = "AVAILABLE",
  ) => {
    const id = uuidv7();
    await client.bike.create({
      data: {
        id,
        chipId: `chip-${id}`,
        stationId,
        supplierId: null,
        status,
        updatedAt: new Date(),
      },
    });
    return { id };
  };

  it("getById returns the bike", async () => {
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId);

    const result = await Effect.runPromise(repo.getById(bikeId));
    if (Option.isNone(result)) {
      throw new Error("Expected bike to exist");
    }
    expect(result.value.id).toBe(bikeId);
  });

  it("getById returns Option.none for missing bike", async () => {
    const result = await Effect.runPromise(repo.getById(uuidv7()));
    expect(Option.isNone(result)).toBe(true);
  });

  it("listByStationWithOffset returns bikes for station", async () => {
    const { id: stationId } = await createStation();
    await createBike(stationId, "AVAILABLE");
    await createBike(stationId, "BOOKED");

    const result = await Effect.runPromise(
      repo.listByStationWithOffset(stationId, {}, { page: 1, pageSize: 10 }),
    );

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("updateStatus updates the bike status", async () => {
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId, "AVAILABLE");

    const result = await Effect.runPromise(repo.updateStatus(bikeId, "BOOKED"));
    if (Option.isNone(result)) {
      throw new Error("Expected bike to be updated");
    }
    expect(result.value.status).toBe("BOOKED");
  });

  it("updateStatus returns Option.none for missing bike", async () => {
    const result = await Effect.runPromise(repo.updateStatus(uuidv7(), "BOOKED"));
    expect(Option.isNone(result)).toBe(true);
  });

  it("reserveBikeIfAvailableInTx marks available bike as reserved", async () => {
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId, "AVAILABLE");
    const now = new Date();

    const reserved = await client.$transaction(async (tx) =>
      Effect.runPromise(repo.reserveBikeIfAvailableInTx(tx, bikeId, now)),
    );

    expect(reserved).toBe(true);

    const updated = await Effect.runPromise(repo.getById(bikeId));
    if (Option.isNone(updated)) {
      throw new Error("Expected bike to exist");
    }
    expect(updated.value.status).toBe("RESERVED");
  });

  it("bookBikeIfReservedInTx marks reserved bike as booked", async () => {
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId, "RESERVED");
    const now = new Date();

    const booked = await client.$transaction(async (tx) =>
      Effect.runPromise(repo.bookBikeIfReservedInTx(tx, bikeId, now)),
    );

    expect(booked).toBe(true);

    const updated = await Effect.runPromise(repo.getById(bikeId));
    if (Option.isNone(updated)) {
      throw new Error("Expected bike to exist");
    }
    expect(updated.value.status).toBe("BOOKED");
  });

  it("releaseBikeIfReservedInTx marks reserved bike as available", async () => {
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike(stationId, "RESERVED");
    const now = new Date();

    const released = await client.$transaction(async (tx) =>
      Effect.runPromise(repo.releaseBikeIfReservedInTx(tx, bikeId, now)),
    );

    expect(released).toBe(true);

    const updated = await Effect.runPromise(repo.getById(bikeId));
    if (Option.isNone(updated)) {
      throw new Error("Expected bike to exist");
    }
    expect(updated.value.status).toBe("AVAILABLE");
  });

  it("returns BikeRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    const brokenRepo = makeBikeRepository(broken.client);

    const result = await Effect.runPromise(
      brokenRepo.getById(uuidv7()).pipe(Effect.either),
    );

    if (Either.isRight(result)) {
      throw new Error("Expected failure but got success");
    }
    expect(result.left._tag).toBe("BikeRepositoryError");

    await broken.stop();
  });
});
