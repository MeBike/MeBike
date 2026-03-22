import { Effect, Layer } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import type { SubscriptionServiceTag } from "@/domain/subscriptions";

import { BikeRepository, makeBikeRepository } from "@/domain/bikes";
import { makeRentalRepository, RentalRepository, startRental } from "@/domain/rentals";
import {
  makeSubscriptionRepository,
  SubscriptionRepository,
  SubscriptionServiceLive,
} from "@/domain/subscriptions";
import { makeWalletRepository, WalletRepository } from "@/domain/wallets";
import { Prisma } from "@/infrastructure/prisma";
import { expectLeftTag, expectRight } from "@/test/effect/assertions";
import { runEffectEither, runEffectEitherWithLayer } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenActiveRental, givenStationWithAvailableBike, givenUserWithWallet } from "@/test/scenarios";

describe("startRentalUseCase Integration", () => {
  const fixture = setupPrismaIntFixture();
  let depsLayer: Layer.Layer<
    Prisma | RentalRepository | BikeRepository | WalletRepository | SubscriptionServiceTag
  >;

  beforeAll(() => {
    const rentalRepo = makeRentalRepository(fixture.prisma);
    const bikeRepo = makeBikeRepository(fixture.prisma);
    const walletRepo = makeWalletRepository(fixture.prisma);
    const subscriptionRepoLayer = Layer.succeed(
      SubscriptionRepository,
      makeSubscriptionRepository(fixture.prisma),
    );
    const subscriptionServiceLayer = SubscriptionServiceLive.pipe(
      Layer.provide(subscriptionRepoLayer),
    );

    depsLayer = Layer.mergeAll(
      Layer.succeed(Prisma, Prisma.make({ client: fixture.prisma })),
      Layer.succeed(RentalRepository, RentalRepository.make(rentalRepo)),
      Layer.succeed(BikeRepository, BikeRepository.make(bikeRepo)),
      Layer.succeed(WalletRepository, walletRepo),
      subscriptionRepoLayer,
      subscriptionServiceLayer,
    );
  });

  const runStartRental = (args: {
    userId: string;
    bikeId: string;
    startStationId: string;
  }) => runEffectEitherWithLayer(
    startRental({
      userId: args.userId,
      bikeId: args.bikeId,
      startStationId: args.startStationId,
      startTime: new Date(),
    }),
    depsLayer,
  );

  it("creates a rental and books the bike", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 600000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture);

    const result = await runStartRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
    });

    const rental = expectRight(result);
    const activePricingPolicy = await fixture.prisma.pricingPolicy.findFirst({
      where: { status: "ACTIVE" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    expect(rental.status).toBe("RENTED");
    expect(rental.userId).toBe(user.id);
    expect(rental.bikeId).toBe(bike.id);
    expect(rental.pricingPolicyId).toBe(activePricingPolicy?.id ?? null);
    expect(rental.depositHoldId).not.toBeNull();

    const hold = await fixture.prisma.walletHold.findUnique({
      where: { id: rental.depositHoldId! },
    });
    expect(hold?.reason).toBe("RENTAL_DEPOSIT");
    expect(hold?.rentalId).toBe(rental.id);
    expect(hold?.status).toBe("ACTIVE");

    const wallet = await fixture.prisma.wallet.findUnique({
      where: { userId: user.id },
    });
    expect(wallet?.reservedBalance.toString()).toBe(activePricingPolicy?.depositRequired.toString());

    const updatedBike = await fixture.prisma.bike.findUnique({ where: { id: bike.id } });
    expect(updatedBike?.status).toBe("BOOKED");
  });

  it("fails when user already has an active rental", async () => {
    const { user, station, bike } = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
    });

    const result = await runStartRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
    });

    expectLeftTag(result, "ActiveRentalExists");
  });

  it("fails when bike already rented by someone else", async () => {
    const activeRental = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
    });
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 5000n },
    });

    const result = await runStartRental({
      userId: user.id,
      bikeId: activeRental.bike.id,
      startStationId: activeRental.station.id,
    });

    expectLeftTag(result, "BikeAlreadyRented");
  });

  it("fails when bike is missing", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 5000n },
    });
    const station = await fixture.factories.station();

    const result = await runStartRental({
      userId: user.id,
      bikeId: uuidv7(),
      startStationId: station.id,
    });

    expectLeftTag(result, "BikeNotFound");
  });

  it("fails when bike has no station", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 5000n },
    });
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: null });

    const result = await runStartRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
    });

    expectLeftTag(result, "BikeMissingStation");
  });

  it("fails when bike is in a different station", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 5000n },
    });
    const startStation = await fixture.factories.station();
    const otherStation = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: otherStation.id });

    const result = await runStartRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: startStation.id,
    });

    expectLeftTag(result, "BikeNotFoundInStation");
  });

  it.each([
    { status: "BOOKED", tag: "BikeAlreadyRented" },
    { status: "BROKEN", tag: "BikeIsBroken" },
    { status: "MAINTAINED", tag: "BikeIsMaintained" },
    { status: "RESERVED", tag: "BikeIsReserved" },
    { status: "UNAVAILABLE", tag: "BikeUnavailable" },
  ] as const)("fails when bike status is $status", async ({ status, tag }) => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 5000n },
    });
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id, status });

    const result = await runStartRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
    });

    expectLeftTag(result, tag);
  });

  it("fails when user wallet is missing", async () => {
    const user = await fixture.factories.user();
    const { station, bike } = await givenStationWithAvailableBike(fixture);

    const result = await runStartRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
    });

    expectLeftTag(result, "UserWalletNotFound");
  });

  it("fails when wallet balance is insufficient", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 1000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture);

    const result = await runStartRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
    });

    expectLeftTag(result, "InsufficientBalanceToRent");
  });

  it("emits RentalUniqueViolation on duplicate active rentals (repo)", async () => {
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id });

    const byBike = await fixture.prisma.$transaction(async (tx) => {
      const txRentalRepo = makeRentalRepository(tx);
      const first = await runEffectEither(
        txRentalRepo.createRental({
          userId: user.id,
          bikeId: bike.id,
          startStationId: station.id,
          startTime: new Date(),
        }),
      );

      expectRight(first);

      return runEffectEither(
        txRentalRepo.createRental({
          userId: uuidv7(),
          bikeId: bike.id,
          startStationId: station.id,
          startTime: new Date(),
        }),
      );
    });

    expectLeftTag(byBike, "RentalUniqueViolation");

    const bike2 = await fixture.factories.bike({ stationId: station.id });
    const byUser = await fixture.prisma.$transaction(async (tx) => {
      const txRentalRepo = makeRentalRepository(tx);
      return runEffectEither(
        Effect.all([
          txRentalRepo.createRental({
            userId: user.id,
            bikeId: bike2.id,
            startStationId: station.id,
            startTime: new Date(),
          }),
          txRentalRepo.createRental({
            userId: user.id,
            bikeId: uuidv7(),
            startStationId: station.id,
            startTime: new Date(),
          }),
        ]),
      );
    });

    expectLeftTag(byUser, "RentalUniqueViolation");
  });
});
