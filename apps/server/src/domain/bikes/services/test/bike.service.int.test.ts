import { Effect, Layer } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { BikeRepository } from "@/domain/bikes/repository/bike.repository";
import { Prisma } from "@/infrastructure/prisma";
import { expectLeftTag, expectRight } from "@/test/effect/assertions";
import { runEffectEitherWithLayer, runEffectWithLayer } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { bikeRepositoryFactory } from "../../repository/bike.repository";
import { BikeServiceLive, BikeServiceTag } from "../bike.service";

describe("bikeService Integration", () => {
  const fixture = setupPrismaIntFixture();
  let depsLayer: Layer.Layer<BikeServiceTag | BikeRepository | Prisma>;

  beforeAll(() => {
    const prismaLayer = Layer.succeed(Prisma, Prisma.make({ client: fixture.prisma }));
    const bikeRepoLayer = Layer.succeed(
      BikeRepository,
      BikeRepository.make(bikeRepositoryFactory(fixture.prisma)),
    );
    const bikeServiceLayer = BikeServiceLive.pipe(
      Layer.provide(bikeRepoLayer),
      Layer.provide(prismaLayer),
    );

    depsLayer = Layer.mergeAll(prismaLayer, bikeRepoLayer, bikeServiceLayer);
  });

  const createBike = (args: { stationId: string; supplierId: string; chipId?: string }) =>
    fixture.factories.bike({
      stationId: args.stationId,
      supplierId: args.supplierId,
      chipId: args.chipId,
      status: "AVAILABLE",
    });

  const runCreateBike = (input: {
    chipId: string;
    stationId: string;
    supplierId: string;
    status: "AVAILABLE";
  }) => runEffectWithLayer(
    Effect.flatMap(BikeServiceTag, service => service.createBike(input)),
    depsLayer,
  );

  const runCreateBikeEither = (input: {
    chipId: string;
    stationId: string;
    supplierId: string;
    status: "AVAILABLE";
  }) => runEffectEitherWithLayer(
    Effect.flatMap(BikeServiceTag, service => service.createBike(input)),
    depsLayer,
  );

  const runAdminUpdateBikeEither = (bikeId: string, input: {
    stationId?: string;
    supplierId?: string;
    chipId?: string;
  }) => runEffectEitherWithLayer(
    Effect.flatMap(BikeServiceTag, service => service.adminUpdateBike(bikeId, input)),
    depsLayer,
  );

  it("fails with BikeStationNotFound when station does not exist", async () => {
    const supplier = await fixture.factories.supplier();

    const result = await runCreateBikeEither({
      chipId: `chip-${uuidv7()}`,
      stationId: uuidv7(),
      supplierId: supplier.id,
      status: "AVAILABLE",
    });

    expectLeftTag(result, "BikeStationNotFound");
  });

  it("fails with BikeSupplierNotFound when supplier does not exist", async () => {
    const station = await fixture.factories.station();

    const result = await runCreateBikeEither({
      chipId: `chip-${uuidv7()}`,
      stationId: station.id,
      supplierId: uuidv7(),
      status: "AVAILABLE",
    });

    expectLeftTag(result, "BikeSupplierNotFound");
  });

  it("creates bike when station and supplier both exist", async () => {
    const station = await fixture.factories.station();
    const supplier = await fixture.factories.supplier();

    const created = await runCreateBike({
      chipId: `chip-${uuidv7()}`,
      stationId: station.id,
      supplierId: supplier.id,
      status: "AVAILABLE",
    });

    expect(created.stationId).toBe(station.id);
    expect(created.supplierId).toBe(supplier.id);
    expect(created.status).toBe("AVAILABLE");
  });

  it("update fails with BikeStationNotFound when station does not exist", async () => {
    const station = await fixture.factories.station();
    const supplier = await fixture.factories.supplier();
    const bike = await createBike({ stationId: station.id, supplierId: supplier.id });

    const result = await runAdminUpdateBikeEither(bike.id, {
      stationId: uuidv7(),
    });

    expectLeftTag(result, "BikeStationNotFound");
  });

  it("update fails with BikeSupplierNotFound when supplier does not exist", async () => {
    const station = await fixture.factories.station();
    const supplier = await fixture.factories.supplier();
    const bike = await createBike({ stationId: station.id, supplierId: supplier.id });

    const result = await runAdminUpdateBikeEither(bike.id, {
      supplierId: uuidv7(),
    });

    expectLeftTag(result, "BikeSupplierNotFound");
  });

  it("update fails with DuplicateChipId when chipId already exists", async () => {
    const station = await fixture.factories.station();
    const supplier = await fixture.factories.supplier();
    const primaryBike = await createBike({ stationId: station.id, supplierId: supplier.id });
    const existingBike = await createBike({ stationId: station.id, supplierId: supplier.id });

    const result = await runAdminUpdateBikeEither(primaryBike.id, {
      chipId: existingBike.chipId,
    });

    expectLeftTag(result, "DuplicateChipId");
  });

  it("update succeeds when changing to another valid station and supplier", async () => {
    const originalStation = await fixture.factories.station();
    const nextStation = await fixture.factories.station();
    const originalSupplier = await fixture.factories.supplier();
    const nextSupplier = await fixture.factories.supplier();
    const bike = await createBike({ stationId: originalStation.id, supplierId: originalSupplier.id });

    const result = await runEffectEitherWithLayer(
      Effect.flatMap(BikeServiceTag, service => service.adminUpdateBike(bike.id, {
        stationId: nextStation.id,
        supplierId: nextSupplier.id,
      })),
      depsLayer,
    );

    const updated = expectRight(result);
    expect(updated._tag).toBe("Some");
    if (updated._tag === "Some") {
      expect(updated.value.stationId).toBe(nextStation.id);
      expect(updated.value.supplierId).toBe(nextSupplier.id);
    }
  });
});
