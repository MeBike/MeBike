import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import {
  australiaCoords,
  setupStationRepositoryIntTestKit,
  vietnamCoords,
} from "../station.repository.int.test-kit";

describe("stationWriteRepository Integration", () => {
  const kit = setupStationRepositoryIntTestKit();
  let repo: ReturnType<typeof kit.makeRepo>;

  beforeAll(() => {
    repo = kit.makeRepo();
  });

  it("create inserts station with coordinates", async () => {
    const created = await Effect.runPromise(
      repo.create({
        name: "Create Station",
        address: "456 Create St",
        totalCapacity: 24,
        latitude: vietnamCoords.latitude,
        longitude: vietnamCoords.longitude,
      }),
    );

    expect(created.id).toBeTruthy();
    expect(created.name).toBe("Create Station");
    expect(created.address).toBe("456 Create St");
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
        totalCapacity: 10,
        latitude: 10.0,
        longitude: 106.0,
      }),
    );

    const result = await Effect.runPromise(
      repo.create({
        name,
        address: "123 Dup St",
        totalCapacity: 10,
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
        totalCapacity: 10,
        latitude: vietnamCoords.latitude,
        longitude: vietnamCoords.longitude,
      }),
    );

    const updatedOpt = await Effect.runPromise(
      repo.update(created.id, {
        name: "Updated Station Name",
        address: "New Address",
        totalCapacity: 12,
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
        totalCapacity: 10,
        latitude: vietnamCoords.latitude,
        longitude: vietnamCoords.longitude,
      }),
    );
    await Effect.runPromise(
      repo.create({
        name: secondName,
        address: "Addr 2",
        totalCapacity: 10,
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

  it("create returns StationOutsideSupportedArea for coordinates outside VN boundary", async () => {
    const result = await Effect.runPromise(
      repo.create({
        name: `Outside Area ${Date.now()}`,
        address: "Outside",
        totalCapacity: 10,
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
        totalCapacity: 10,
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
        totalCapacity: 30,
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
