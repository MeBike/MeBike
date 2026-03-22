import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeStationRepository } from "../station.repository";

const vietnamCoords = {
  latitude: 21.37481197044971,
  longitude: 104.84103211277719,
};

const australiaCoords = {
  latitude: -19.88806511187122,
  longitude: 120.81014790361665,
};

describe("stationRepository Integration", () => {
  const fixture = setupPrismaIntFixture({
    seedData: async ({ prisma }) => {
      await prisma.$executeRaw`
        INSERT INTO "GeoBoundary" ("code", "geom")
        VALUES (
          'VN',
          ST_Multi(
            ST_GeomFromText(
              'POLYGON((102 8, 110.5 8, 110.5 23.5, 102 23.5, 102 8))',
              4326
            )
          )::geometry(MultiPolygon, 4326)
        )
        ON CONFLICT ("code") DO UPDATE
          SET "geom" = EXCLUDED."geom"
      `;
    },
  });
  let repo: ReturnType<typeof makeStationRepository>;

  beforeAll(() => {
    repo = makeStationRepository(fixture.prisma);
  });

  const createStation = async (args: { name: string; latitude: number; longitude: number }) => {
    const station = await fixture.factories.station(args);
    return { id: station.id };
  };

  it("listWithOffset returns stations", async () => {
    await createStation({ name: "Station A", latitude: 10.0, longitude: 106.0 });
    await createStation({ name: "Station B", latitude: 11.0, longitude: 107.0 });

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
        latitude: vietnamCoords.latitude,
        longitude: vietnamCoords.longitude,
      }),
    );

    expect(created.id).toBeTruthy();
    expect(created.name).toBe("Create Station");
    expect(created.address).toBe("456 Create St");
    expect(created.capacity).toBe(24);
    expect(created.totalCapacity).toBe(24);
    expect(created.pickupSlotLimit).toBe(24);
    expect(created.returnSlotLimit).toBe(24);
    expect(created.latitude).toBeCloseTo(vietnamCoords.latitude, 10);
    expect(created.longitude).toBeCloseTo(vietnamCoords.longitude, 10);
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
        longitude: 106.0,
      }),
    );

    const result = await Effect.runPromise(
      repo.create({
        name,
        address: "123 Dup St",
        capacity: 10,
        latitude: 10.0,
        longitude: 106.0,
      }).pipe(Effect.either),
    );

    if (Either.isRight(result)) {
      throw new Error("Expected duplicate-name failure but got success");
    }

    expect(result.left._tag).toBe("StationNameAlreadyExists");
  });

  it("update modifies station fields and keeps position in sync", async () => {
    const created = await Effect.runPromise(
      repo.create({
        name: `Update Me ${Date.now()}`,
        address: "Old Address",
        capacity: 10,
        latitude: vietnamCoords.latitude,
        longitude: vietnamCoords.longitude,
      }),
    );

    const updatedOpt = await Effect.runPromise(
      repo.update(created.id, {
        name: "Updated Station Name",
        address: "New Address",
        capacity: 12,
        latitude: 21.3749,
        longitude: 104.8411,
      }),
    );

    if (Option.isNone(updatedOpt)) {
      throw new Error("Expected updated station but got none");
    }

    const updated = updatedOpt.value;
    expect(updated.name).toBe("Updated Station Name");
    expect(updated.address).toBe("New Address");
    expect(updated.capacity).toBe(12);
    expect(updated.totalCapacity).toBe(12);
    expect(updated.pickupSlotLimit).toBe(12);
    expect(updated.returnSlotLimit).toBe(12);
    expect(updated.latitude).toBeCloseTo(21.3749, 10);
    expect(updated.longitude).toBeCloseTo(104.8411, 10);
  });

  it("update returns Option.none for missing station", async () => {
    const updatedOpt = await Effect.runPromise(
      repo.update(uuidv7(), {
        name: "Will Not Exist",
      }),
    );

    expect(Option.isNone(updatedOpt)).toBe(true);
  });

  it("update maps duplicate station name to StationNameAlreadyExists", async () => {
    const firstName = `First ${Date.now()}`;
    const secondName = `Second ${Date.now()}`;
    const first = await Effect.runPromise(
      repo.create({
        name: firstName,
        address: "Addr 1",
        capacity: 10,
        latitude: vietnamCoords.latitude,
        longitude: vietnamCoords.longitude,
      }),
    );
    await Effect.runPromise(
      repo.create({
        name: secondName,
        address: "Addr 2",
        capacity: 10,
        latitude: vietnamCoords.latitude,
        longitude: vietnamCoords.longitude,
      }),
    );

    const result = await Effect.runPromise(
      repo.update(first.id, {
        name: secondName,
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
      longitude: 106.0,
    });
    const { id: farId } = await createStation({
      name: "Far Station",
      latitude: 10.001,
      longitude: 106.001,
    });

    const result = await Effect.runPromise(
      repo.listNearest({
        latitude: 10.0,
        longitude: 106.0,
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
    try {
      const brokenRepo = makeStationRepository(broken.client);

      const result = await Effect.runPromise(
        brokenRepo.listWithOffset({}, { page: 1, pageSize: 10 }).pipe(Effect.either),
      );

      if (Either.isRight(result)) {
        throw new Error("Expected failure but got success");
      }
      expect(result.left._tag).toBe("StationRepositoryError");
    }
    finally {
      await broken.stop();
    }
  });

  it("create returns StationOutsideSupportedArea for coordinates outside VN boundary", async () => {
    const result = await Effect.runPromise(
      repo.create({
        name: `Outside Area ${Date.now()}`,
        address: "Outside",
        capacity: 10,
        latitude: australiaCoords.latitude,
        longitude: australiaCoords.longitude,
      }).pipe(Effect.either),
    );

    if (Either.isRight(result)) {
      throw new Error("Expected outside-area failure but got success");
    }
    expect(result.left._tag).toBe("StationOutsideSupportedArea");
  });

  it("update returns StationOutsideSupportedArea for coordinates outside VN boundary", async () => {
    const created = await Effect.runPromise(
      repo.create({
        name: `Update Outside ${Date.now()}`,
        address: "Inside",
        capacity: 10,
        latitude: vietnamCoords.latitude,
        longitude: vietnamCoords.longitude,
      }),
    );

    const result = await Effect.runPromise(
      repo.update(created.id, {
        latitude: australiaCoords.latitude,
        longitude: australiaCoords.longitude,
      }).pipe(Effect.either),
    );

    if (Either.isRight(result)) {
      throw new Error("Expected outside-area failure but got success");
    }
    expect(result.left._tag).toBe("StationOutsideSupportedArea");
  });

  it("create supports explicit pickup and return slot limits", async () => {
    const created = await Effect.runPromise(
      repo.create({
        name: `Capacity Split ${Date.now()}`,
        address: "Split Address",
        capacity: 30,
        pickupSlotLimit: 12,
        returnSlotLimit: 8,
        latitude: vietnamCoords.latitude,
        longitude: vietnamCoords.longitude,
      }),
    );

    expect(created.totalCapacity).toBe(30);
    expect(created.pickupSlotLimit).toBe(12);
    expect(created.returnSlotLimit).toBe(8);
  });
});
