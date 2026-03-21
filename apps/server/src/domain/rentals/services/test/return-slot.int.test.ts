import { Layer } from "effect";
import { beforeAll, describe, expect, it } from "vitest";

import type { BikeRepository } from "@/domain/bikes";
import type { SubscriptionRepository } from "@/domain/subscriptions";
import type { Prisma } from "@/infrastructure/prisma";

import { BikeRepository as BikeRepositoryTag, makeBikeRepository } from "@/domain/bikes";
import {
  cancelReturnSlotUseCase,
  createReturnSlotUseCase,
  endRentalUseCase,
  getCurrentReturnSlotUseCase,
  makeRentalRepository,
  makeReturnSlotRepository,
  RentalRepository,
  ReturnSlotRepository,
} from "@/domain/rentals";
import { makeSubscriptionRepository, SubscriptionRepository as SubscriptionRepositoryTag } from "@/domain/subscriptions";
import { Prisma as PrismaTag } from "@/infrastructure/prisma";
import { expectLeftTag, expectRight } from "@/test/effect/assertions";
import { runEffectEitherWithLayer, runEffectWithLayer } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenActiveRental, givenStationWithAvailableBike, givenUserWithWallet } from "@/test/scenarios";

describe("return slot integration", () => {
  const fixture = setupPrismaIntFixture();
  let depsLayer: Layer.Layer<
    Prisma | RentalRepository | ReturnSlotRepository | BikeRepository | SubscriptionRepository
  >;

  beforeAll(() => {
    depsLayer = Layer.mergeAll(
      Layer.succeed(PrismaTag, PrismaTag.make({ client: fixture.prisma })),
      Layer.succeed(RentalRepository, RentalRepository.make(makeRentalRepository(fixture.prisma))),
      Layer.succeed(ReturnSlotRepository, ReturnSlotRepository.make(makeReturnSlotRepository(fixture.prisma))),
      Layer.succeed(BikeRepositoryTag, BikeRepositoryTag.make(makeBikeRepository(fixture.prisma))),
      Layer.succeed(SubscriptionRepositoryTag, makeSubscriptionRepository(fixture.prisma)),
    );
  });

  it("creates and fetches an active return slot for an active rental", async () => {
    const { user, rental } = await givenActiveRental(fixture);
    const targetStation = await fixture.factories.station({ capacity: 2 });
    await fixture.factories.bike({ stationId: targetStation.id, status: "AVAILABLE" });

    const createdResult = await runEffectEitherWithLayer(
      createReturnSlotUseCase({
        rentalId: rental.id,
        userId: user.id,
        stationId: targetStation.id,
        now: new Date("2026-03-21T12:00:00.000Z"),
      }),
      depsLayer,
    );

    const created = expectRight(createdResult);
    expect(created.status).toBe("ACTIVE");
    expect(created.rentalId).toBe(rental.id);
    expect(created.userId).toBe(user.id);
    expect(created.stationId).toBe(targetStation.id);

    const current = await runEffectWithLayer(
      getCurrentReturnSlotUseCase({ rentalId: rental.id, userId: user.id }),
      depsLayer,
    );

    expect(current._tag).toBe("Some");
    if (current._tag === "Some") {
      expect(current.value.id).toBe(created.id);
      expect(current.value.stationId).toBe(targetStation.id);
    }
  });

  it("reuses the existing active return slot when the station does not change", async () => {
    const { user, rental } = await givenActiveRental(fixture);
    const targetStation = await fixture.factories.station({ capacity: 2 });

    const first = expectRight(await runEffectEitherWithLayer(
      createReturnSlotUseCase({ rentalId: rental.id, userId: user.id, stationId: targetStation.id }),
      depsLayer,
    ));

    const second = expectRight(await runEffectEitherWithLayer(
      createReturnSlotUseCase({ rentalId: rental.id, userId: user.id, stationId: targetStation.id }),
      depsLayer,
    ));

    expect(second.id).toBe(first.id);

    const slots = await fixture.prisma.returnSlotReservation.findMany({ where: { rentalId: rental.id } });
    expect(slots).toHaveLength(1);
  });

  it("replaces the active return slot when the destination station changes", async () => {
    const { user, rental } = await givenActiveRental(fixture);
    const firstStation = await fixture.factories.station({ capacity: 2 });
    const secondStation = await fixture.factories.station({ capacity: 2 });

    const first = expectRight(await runEffectEitherWithLayer(
      createReturnSlotUseCase({ rentalId: rental.id, userId: user.id, stationId: firstStation.id }),
      depsLayer,
    ));

    const second = expectRight(await runEffectEitherWithLayer(
      createReturnSlotUseCase({ rentalId: rental.id, userId: user.id, stationId: secondStation.id }),
      depsLayer,
    ));

    expect(second.id).not.toBe(first.id);
    expect(second.stationId).toBe(secondStation.id);

    const rows = await fixture.prisma.returnSlotReservation.findMany({
      where: { rentalId: rental.id },
      orderBy: { createdAt: "asc" },
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.status).toBe("CANCELLED");
    expect(rows[1]?.status).toBe("ACTIVE");
  });

  it("cancels the active return slot", async () => {
    const { user, rental } = await givenActiveRental(fixture);
    const targetStation = await fixture.factories.station({ capacity: 2 });

    expectRight(await runEffectEitherWithLayer(
      createReturnSlotUseCase({ rentalId: rental.id, userId: user.id, stationId: targetStation.id }),
      depsLayer,
    ));

    const cancelled = expectRight(await runEffectEitherWithLayer(
      cancelReturnSlotUseCase({ rentalId: rental.id, userId: user.id }),
      depsLayer,
    ));

    expect(cancelled.status).toBe("CANCELLED");

    const current = await runEffectWithLayer(
      getCurrentReturnSlotUseCase({ rentalId: rental.id, userId: user.id }),
      depsLayer,
    );

    expect(current._tag).toBe("None");
  });

  it("fails when the destination station has no remaining logical return capacity", async () => {
    const { user, rental } = await givenActiveRental(fixture);
    const fullStation = await fixture.factories.station({ capacity: 1 });
    await fixture.factories.bike({ stationId: fullStation.id, status: "AVAILABLE" });

    const result = await runEffectEitherWithLayer(
      createReturnSlotUseCase({ rentalId: rental.id, userId: user.id, stationId: fullStation.id }),
      depsLayer,
    );

    expectLeftTag(result, "ReturnSlotCapacityExceeded");
  });

  it("fails when logical return capacity is exhausted by another active return slot", async () => {
    const first = await givenActiveRental(fixture);
    const second = await givenActiveRental(fixture);
    const station = await fixture.factories.station({ capacity: 2 });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    expectRight(await runEffectEitherWithLayer(
      createReturnSlotUseCase({
        rentalId: first.rental.id,
        userId: first.user.id,
        stationId: station.id,
      }),
      depsLayer,
    ));

    const result = await runEffectEitherWithLayer(
      createReturnSlotUseCase({
        rentalId: second.rental.id,
        userId: second.user.id,
        stationId: station.id,
      }),
      depsLayer,
    );

    expectLeftTag(result, "ReturnSlotCapacityExceeded");
  });

  it("fails when the target station does not exist", async () => {
    const { user, rental } = await givenActiveRental(fixture);

    const result = await runEffectEitherWithLayer(
      createReturnSlotUseCase({
        rentalId: rental.id,
        userId: user.id,
        stationId: "0195d86e-0861-7d56-b743-5a2264f0f999",
      }),
      depsLayer,
    );

    expectLeftTag(result, "StationNotFound");
  });

  it("fails when creating a return slot for another user's rental", async () => {
    const owner = await givenActiveRental(fixture);
    const otherUser = await givenUserWithWallet(fixture);
    const targetStation = await fixture.factories.station({ capacity: 2 });

    const result = await runEffectEitherWithLayer(
      createReturnSlotUseCase({
        rentalId: owner.rental.id,
        userId: otherUser.user.id,
        stationId: targetStation.id,
      }),
      depsLayer,
    );

    expectLeftTag(result, "RentalNotFound");
  });

  it("fails to get a return slot for another user's rental", async () => {
    const owner = await givenActiveRental(fixture);
    const otherUser = await givenUserWithWallet(fixture);
    const targetStation = await fixture.factories.station({ capacity: 2 });

    expectRight(await runEffectEitherWithLayer(
      createReturnSlotUseCase({
        rentalId: owner.rental.id,
        userId: owner.user.id,
        stationId: targetStation.id,
      }),
      depsLayer,
    ));

    const result = await runEffectEitherWithLayer(
      getCurrentReturnSlotUseCase({
        rentalId: owner.rental.id,
        userId: otherUser.user.id,
      }),
      depsLayer,
    );

    expectLeftTag(result, "RentalNotFound");
  });

  it("fails when the rental is not active", async () => {
    const { user } = await givenUserWithWallet(fixture);
    const { station, bike } = await givenStationWithAvailableBike(fixture);
    const rental = await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      status: "COMPLETED",
      endStationId: station.id,
      endTime: new Date(),
    });
    const targetStation = await fixture.factories.station({ capacity: 2 });

    const result = await runEffectEitherWithLayer(
      createReturnSlotUseCase({ rentalId: rental.id, userId: user.id, stationId: targetStation.id }),
      depsLayer,
    );

    expectLeftTag(result, "ReturnSlotRequiresActiveRental");
  });

  it("fails to cancel when no active return slot exists", async () => {
    const { user, rental } = await givenActiveRental(fixture);

    const result = await runEffectEitherWithLayer(
      cancelReturnSlotUseCase({ rentalId: rental.id, userId: user.id }),
      depsLayer,
    );

    expectLeftTag(result, "ReturnSlotNotFound");
  });

  it("fails to get the current return slot when the rental is not active", async () => {
    const { user } = await givenUserWithWallet(fixture);
    const { station, bike } = await givenStationWithAvailableBike(fixture);
    const rental = await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      status: "COMPLETED",
      endStationId: station.id,
      endTime: new Date(),
    });

    const result = await runEffectEitherWithLayer(
      getCurrentReturnSlotUseCase({ rentalId: rental.id, userId: user.id }),
      depsLayer,
    );

    expectLeftTag(result, "ReturnSlotRequiresActiveRental");
  });

  it("cancels the active return slot when the rental ends", async () => {
    const { user, station, bike, rental } = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
    });

    expectRight(await runEffectEitherWithLayer(
      createReturnSlotUseCase({ rentalId: rental.id, userId: user.id, stationId: station.id }),
      depsLayer,
    ));

    const ended = expectRight(await runEffectEitherWithLayer(
      endRentalUseCase({
        rentalId: rental.id,
        userId: user.id,
        endStationId: station.id,
        endTime: new Date(Date.now() + 30 * 60 * 1000),
      }),
      depsLayer,
    ));

    expect(ended.status).toBe("COMPLETED");

    const current = await fixture.prisma.returnSlotReservation.findFirst({
      where: { rentalId: rental.id },
      orderBy: { createdAt: "desc" },
    });
    expect(current?.status).toBe("USED");

    const updatedBike = await fixture.prisma.bike.findUnique({ where: { id: bike.id } });
    expect(updatedBike?.status).toBe("AVAILABLE");
  });

  it("fails to end a rental without an active return slot", async () => {
    const { user, station, rental } = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
    });

    const result = await runEffectEitherWithLayer(
      endRentalUseCase({
        rentalId: rental.id,
        userId: user.id,
        endStationId: station.id,
        endTime: new Date(Date.now() + 30 * 60 * 1000),
      }),
      depsLayer,
    );

    expectLeftTag(result, "ReturnSlotRequiredForReturn");
  });

  it("fails to end a rental at a different station than the active return slot", async () => {
    const { user, rental } = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
    });
    const reservedStation = await fixture.factories.station({ capacity: 2 });
    const attemptedStation = await fixture.factories.station({ capacity: 2 });

    expectRight(await runEffectEitherWithLayer(
      createReturnSlotUseCase({
        rentalId: rental.id,
        userId: user.id,
        stationId: reservedStation.id,
      }),
      depsLayer,
    ));

    const result = await runEffectEitherWithLayer(
      endRentalUseCase({
        rentalId: rental.id,
        userId: user.id,
        endStationId: attemptedStation.id,
        endTime: new Date(Date.now() + 30 * 60 * 1000),
      }),
      depsLayer,
    );

    expectLeftTag(result, "ReturnSlotStationMismatch");
  });
});
