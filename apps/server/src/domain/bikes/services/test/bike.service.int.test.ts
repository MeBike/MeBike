import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { expectLeftTag } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeBikeRunners, makeBikeTestLayer } from "./bike-test-kit";

describe("bikeService Integration", () => {
  const fixture = setupPrismaIntFixture();
  let runCreateBike: ReturnType<typeof makeBikeRunners>["createBike"];
  let runCreateBikeEither: ReturnType<typeof makeBikeRunners>["createBikeEither"];
  let runAdminUpdateBike: ReturnType<typeof makeBikeRunners>["adminUpdateBike"];
  let runAdminUpdateBikeEither: ReturnType<typeof makeBikeRunners>["adminUpdateBikeEither"];

  beforeAll(() => {
    const runners = makeBikeRunners(makeBikeTestLayer(fixture.prisma));
    runCreateBike = runners.createBike;
    runCreateBikeEither = runners.createBikeEither;
    runAdminUpdateBike = runners.adminUpdateBike;
    runAdminUpdateBikeEither = runners.adminUpdateBikeEither;
  });

  const createBike = (args: { stationId: string; supplierId: string }) =>
    fixture.factories.bike({
      stationId: args.stationId,
      supplierId: args.supplierId,
      status: "AVAILABLE",
    });

  const createActiveReturnSlotAt = async (stationId: string) => {
    const user = await fixture.factories.user({ role: "USER" });
    const rentalStation = await fixture.factories.station();
    const supplier = await fixture.factories.supplier();
    const bike = await fixture.factories.bike({
      stationId: rentalStation.id,
      supplierId: supplier.id,
      status: "BOOKED",
    });
    const rental = await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: rentalStation.id,
      status: "RENTED",
    });

    await fixture.prisma.returnSlotReservation.create({
      data: {
        rentalId: rental.id,
        userId: user.id,
        stationId,
        reservedFrom: new Date(),
        status: "ACTIVE",
      },
    });
  };

  it("fails with BikeStationNotFound when station does not exist", async () => {
    const supplier = await fixture.factories.supplier();

    const result = await runCreateBikeEither({
      stationId: uuidv7(),
      supplierId: supplier.id,
      status: "AVAILABLE",
    });

    expectLeftTag(result, "BikeStationNotFound");
  });

  it("fails with BikeSupplierNotFound when supplier does not exist", async () => {
    const station = await fixture.factories.station();

    const result = await runCreateBikeEither({
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
      stationId: station.id,
      supplierId: supplier.id,
      status: "AVAILABLE",
    });

    expect(created.stationId).toBe(station.id);
    expect(created.supplierId).toBe(supplier.id);
    expect(created.status).toBe("AVAILABLE");
  });

  it("fails with BikeStationPlacementCapacityExceeded when station has no placement space after reserved returns", async () => {
    const station = await fixture.factories.station({ capacity: 1, returnSlotLimit: 0 });
    const supplier = await fixture.factories.supplier();

    await createActiveReturnSlotAt(station.id);

    const result = await runCreateBikeEither({
      stationId: station.id,
      supplierId: supplier.id,
      status: "AVAILABLE",
    });

    expectLeftTag(result, "BikeStationPlacementCapacityExceeded");
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

  it("update succeeds when changing to another valid station and supplier", async () => {
    const originalStation = await fixture.factories.station();
    const nextStation = await fixture.factories.station();
    const originalSupplier = await fixture.factories.supplier();
    const nextSupplier = await fixture.factories.supplier();
    const bike = await createBike({ stationId: originalStation.id, supplierId: originalSupplier.id });

    const result = await runAdminUpdateBike(bike.id, {
      stationId: nextStation.id,
      supplierId: nextSupplier.id,
    });

    expect(result._tag).toBe("Some");
    if (result._tag === "Some") {
      expect(result.value.stationId).toBe(nextStation.id);
      expect(result.value.supplierId).toBe(nextSupplier.id);
    }
  });

  it("fails when admin tries to override booked bike status", async () => {
    const station = await fixture.factories.station();
    const supplier = await fixture.factories.supplier();
    const bike = await fixture.factories.bike({
      stationId: station.id,
      supplierId: supplier.id,
      status: "BOOKED",
    });

    const result = await runAdminUpdateBikeEither(bike.id, {
      status: "AVAILABLE",
    });

    expectLeftTag(result, "InvalidBikeStatus");
  });

  it("fails with BikeStationPlacementCapacityExceeded when moving to station with no placement space after reserved returns", async () => {
    const originalStation = await fixture.factories.station();
    const blockedStation = await fixture.factories.station({ capacity: 1, returnSlotLimit: 0 });
    const supplier = await fixture.factories.supplier();
    const bike = await createBike({ stationId: originalStation.id, supplierId: supplier.id });

    await createActiveReturnSlotAt(blockedStation.id);

    const result = await runAdminUpdateBikeEither(bike.id, {
      stationId: blockedStation.id,
    });

    expectLeftTag(result, "BikeStationPlacementCapacityExceeded");
  });
});
