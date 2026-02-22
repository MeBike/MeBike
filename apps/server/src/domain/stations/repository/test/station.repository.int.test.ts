import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getTestDatabase } from "@/test/db/test-database";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { PrismaClient } from "generated/prisma/client";

import { makeStationRepository } from "../station.repository";

describe("stationRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeStationRepository>;

  beforeAll(async () => {
    container = await getTestDatabase();

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    repo = makeStationRepository(client);
  }, 60000);

  afterEach(async () => {
    await client.station.deleteMany({});
  });

  afterAll(async () => {
    if (client)
      await client.$disconnect();
    if (container)
      await container.stop();
  });

  const createStation = async (args: { name: string; latitude: number; longitude: number }) => {
    const id = uuidv7();
    const address = "123 Test St";
    const capacity = 10;
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
        ${args.name},
        ${address},
        ${capacity},
        ${args.latitude},
        ${args.longitude},
        ${updatedAt},
        ST_SetSRID(ST_MakePoint(${args.longitude}, ${args.latitude}), 4326)::geography
      )
    `;

    return { id };
  };

  it("listWithOffset returns stations", async () => {
    await createStation({ name: "Station A", latitude: 10.0, longitude: 20.0 });
    await createStation({ name: "Station B", latitude: 11.0, longitude: 21.0 });

    const result = await Effect.runPromise(
      repo.listWithOffset({}, { page: 1, pageSize: 10 }),
    );

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("create inserts station with coordinates", async () => {
    const created = await Effect.runPromise(
      repo.create({
        name: "Create Station",
        address: "456 Create St",
        capacity: 24,
        latitude: 10.776,
        longitude: 106.701,
      }),
    );

    expect(created.id).toBeTruthy();
    expect(created.name).toBe("Create Station");
    expect(created.address).toBe("456 Create St");
    expect(created.capacity).toBe(24);
    expect(created.latitude).toBe(10.776);
    expect(created.longitude).toBe(106.701);
    expect(created.totalBikes).toBe(0);
    expect(created.emptySlots).toBe(24);
  });

  it("create maps duplicate station name to StationNameAlreadyExists", async () => {
    const name = `Dup Station ${Date.now()}`;
    await Effect.runPromise(
      repo.create({
        name,
        address: "123 Dup St",
        capacity: 10,
        latitude: 10.0,
        longitude: 20.0,
      }),
    );

    const result = await Effect.runPromise(
      repo.create({
        name,
        address: "123 Dup St",
        capacity: 10,
        latitude: 10.0,
        longitude: 20.0,
      }).pipe(Effect.either),
    );

    if (Either.isRight(result)) {
      throw new Error("Expected duplicate-name failure but got success");
    }

    expect(result.left._tag).toBe("StationNameAlreadyExists");
  });

  it("getById returns Option.none for missing station", async () => {
    const result = await Effect.runPromise(repo.getById(uuidv7()));
    expect(Option.isNone(result)).toBe(true);
  });

  it("listNearest orders stations by distance", async () => {
    const { id: nearId } = await createStation({
      name: "Near Station",
      latitude: 10.0,
      longitude: 20.0,
    });
    const { id: farId } = await createStation({
      name: "Far Station",
      latitude: 10.001,
      longitude: 20.001,
    });

    const result = await Effect.runPromise(
      repo.listNearest({
        latitude: 10.0,
        longitude: 20.0,
        maxDistanceMeters: 500,
        page: 1,
        pageSize: 10,
      }),
    );

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe(nearId);
    expect(result.items[1].id).toBe(farId);
  });

  it("returns StationRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    const brokenRepo = makeStationRepository(broken.client);

    const result = await Effect.runPromise(
      brokenRepo.listWithOffset({}, { page: 1, pageSize: 10 }).pipe(Effect.either),
    );

    if (Either.isRight(result)) {
      throw new Error("Expected failure but got success");
    }
    expect(result.left._tag).toBe("StationRepositoryError");

    await broken.stop();
  });
});
