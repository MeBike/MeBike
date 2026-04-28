import { Effect } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { makeRentalRepository } from "@/domain/rentals";
import { expectLeftTag, expectRight } from "@/test/effect/assertions";
import { runEffectEither } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenActiveRental, givenStationWithAvailableBike, givenUserWithWallet } from "@/test/scenarios";

import { makeRentalRunners, makeRentalTestLayer } from "./rental-test-kit";

describe("startRentalUseCase Integration", () => {
  const fixture = setupPrismaIntFixture();
  let runStartRental: ReturnType<typeof makeRentalRunners>["start"];

  beforeAll(() => {
    runStartRental = makeRentalRunners(makeRentalTestLayer(fixture.prisma)).start;
  });

  it("creates a rental and books the bike", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 600000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture);

    const result = await runStartRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: new Date(),
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
      startTime: new Date(),
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
      startTime: new Date(),
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
      startTime: new Date(),
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
      startTime: new Date(),
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
      startTime: new Date(),
    });

    expectLeftTag(result, "BikeNotFoundInStation");
  });

  it.each([
    { status: "BOOKED", tag: "BikeAlreadyRented" },
    { status: "BROKEN", tag: "BikeIsBroken" },
    { status: "LOST", tag: "BikeIsLost" },
    { status: "RESERVED", tag: "BikeIsReserved" },
    { status: "DISABLED", tag: "BikeIsDisabled" },
    { status: "REDISTRIBUTING", tag: "BikeIsRedistributing" },
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
      startTime: new Date(),
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
      startTime: new Date(),
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
      startTime: new Date(),
    });

    expectLeftTag(result, "InsufficientBalanceToRent");
  });

  it("rejects rental start during overnight closure", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 600000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture);

    const blockedNow = new Date("2026-04-20T16:00:00.000Z");
    const result = await runStartRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: blockedNow,
      now: blockedNow,
    });

    expectLeftTag(result, "OvernightOperationsClosed");
  });

  it("allows rental start again at 05:00", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 600000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture);

    const allowedNow = new Date("2026-04-20T22:00:00.000Z");
    const result = await runStartRental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      startTime: allowedNow,
      now: allowedNow,
    });

    expectRight(result);
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
