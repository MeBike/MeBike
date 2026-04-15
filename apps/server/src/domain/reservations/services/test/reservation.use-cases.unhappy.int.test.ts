import { Either } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { env } from "@/config/env";
import { expectLeftTag, expectRight } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenPendingReservation, givenStationWithAvailableBike, givenUserWithWallet } from "@/test/scenarios";

import { makeReservationRunners, makeReservationTestLayer } from "./reservation-test-kit";

describe("reservation use-cases unhappy paths", () => {
  const fixture = setupPrismaIntFixture();
  let runReserve: ReturnType<typeof makeReservationRunners>["reserve"];
  let runConfirm: ReturnType<typeof makeReservationRunners>["confirm"];
  let runCancel: ReturnType<typeof makeReservationRunners>["cancel"];

  beforeAll(() => {
    const runners = makeReservationRunners(
      makeReservationTestLayer(fixture.prisma),
    );
    runReserve = runners.reserve;
    runConfirm = runners.confirm;
    runCancel = runners.cancel;
  });

  it("reserveBikeUseCase fails with ActiveReservationExists when user already has pending reservation", async () => {
    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 50000n },
    });
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id });

    await fixture.factories.reservation({
      userId: user.id,
      stationId: station.id,
      bikeId: null,
      status: "PENDING",
    });

    const now = new Date();
    const result = await runReserve({ userId: user.id, bikeId: bike.id, stationId: station.id, startTime: now, now });
    expectLeftTag(result, "ActiveReservationExists");
  });

  it("reserveBikeUseCase fails with BikeAlreadyReserved when bike is held", async () => {
    const primary = await givenUserWithWallet(fixture, { wallet: { balance: 50000n } });
    const other = await givenUserWithWallet(fixture, { wallet: { balance: 50000n } });
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id });

    const now = new Date();
    await fixture.factories.reservation({
      userId: other.user.id,
      bikeId: bike.id,
      stationId: station.id,
      status: "PENDING",
      startTime: new Date(now.getTime() - 1000),
      endTime: new Date(now.getTime() + 1000 * 60 * 10),
    });

    const result = await runReserve({
      userId: primary.user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: now,
      now,
    });
    expectLeftTag(result, "BikeAlreadyReserved");
  });

  it("reserveBikeUseCase fails with WalletNotFound when user has no wallet", async () => {
    const user = await fixture.factories.user();
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 1 },
    });

    const now = new Date();
    const result = await runReserve({ userId: user.id, bikeId: bike.id, stationId: station.id, startTime: now, now });
    expectLeftTag(result, "WalletNotFound");
  });

  it("reserveBikeUseCase fails with InsufficientWalletBalance when balance too low", async () => {
    const { user } = await givenUserWithWallet(fixture, { wallet: { balance: 0n } });
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 1 },
    });

    const now = new Date();
    const result = await runReserve({ userId: user.id, bikeId: bike.id, stationId: station.id, startTime: now, now });
    expectLeftTag(result, "InsufficientWalletBalance");
  });

  it("reserveBikeUseCase fails when station availability drops to 50 percent or less", async () => {
    const { user } = await givenUserWithWallet(fixture, { wallet: { balance: 50000n } });
    const station = await fixture.factories.station({
      capacity: 10,
      returnSlotLimit: 10,
    });
    for (let index = 0; index < 4; index++) {
      await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    }
    const bike = await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const now = new Date();
    const result = await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: now,
      now,
    });

    expectLeftTag(result, "StationReservationAvailabilityTooLow");
  });

  it("reserveBikeUseCase serializes station availability checks under concurrent reservations", async () => {
    const first = await givenUserWithWallet(fixture, { wallet: { balance: 50000n } });
    const second = await givenUserWithWallet(fixture, { wallet: { balance: 50000n } });
    const station = await fixture.factories.station({
      capacity: 10,
      returnSlotLimit: 10,
    });

    for (let index = 0; index < 4; index++) {
      await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    }

    const bikeA = await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const bikeB = await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const now = new Date();

    const [firstResult, secondResult] = await Promise.all([
      runReserve({
        userId: first.user.id,
        bikeId: bikeA.id,
        stationId: station.id,
        startTime: now,
        now,
      }),
      runReserve({
        userId: second.user.id,
        bikeId: bikeB.id,
        stationId: station.id,
        startTime: now,
        now,
      }),
    ]);

    const results = [firstResult, secondResult];
    const successCount = results.filter(Either.isRight).length;
    const availabilityFailureCount = results.filter(
      result => Either.isLeft(result) && result.left._tag === "StationReservationAvailabilityTooLow",
    ).length;

    expect(successCount).toBe(1);
    expect(availabilityFailureCount).toBe(1);
    expect(await fixture.prisma.bike.count({ where: { stationId: station.id, status: "RESERVED" } })).toBe(1);
  });

  it("reserveBikeUseCase fails with SubscriptionRequired when subscription option missing id", async () => {
    const { user } = await givenUserWithWallet(fixture, { wallet: { balance: 50000n } });
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 1 },
    });

    const now = new Date();
    const result = await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: now,
      now,
      reservationOption: "SUBSCRIPTION",
    });
    expectLeftTag(result, "SubscriptionRequired");
  });

  it("reserveBikeUseCase fails with SubscriptionNotUsable for mismatched user", async () => {
    const { user } = await givenUserWithWallet(fixture, { wallet: { balance: 50000n } });
    const otherUser = await fixture.factories.user();
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 1 },
    });
    const subscription = await fixture.factories.subscription({ userId: otherUser.id, status: "ACTIVE" });

    const now = new Date();
    const result = await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: now,
      now,
      reservationOption: "SUBSCRIPTION",
      subscriptionId: subscription.id,
    });
    expectLeftTag(result, "SubscriptionNotUsable");
  });

  it("reserveBikeUseCase fails with SubscriptionUsageExceeded when max usage reached", async () => {
    const { user } = await givenUserWithWallet(fixture, { wallet: { balance: 50000n } });
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 1 },
    });
    const subscription = await fixture.factories.subscription({
      userId: user.id,
      status: "ACTIVE",
      maxUsages: 1,
      usageCount: 1,
    });

    const now = new Date();
    const result = await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: now,
      now,
      reservationOption: "SUBSCRIPTION",
      subscriptionId: subscription.id,
    });
    expectLeftTag(result, "SubscriptionUsageExceeded");
  });

  it("confirmReservationUseCase fails with ReservationNotFound", async () => {
    const user = await fixture.factories.user();
    const result = await runConfirm({ reservationId: uuidv7(), userId: user.id, now: new Date() });
    expectLeftTag(result, "ReservationNotFound");
  });

  it("confirmReservationUseCase fails with ReservationNotOwned", async () => {
    const reservationOwner = await fixture.factories.user();
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id });
    const reservation = await fixture.factories.reservation({
      userId: reservationOwner.id,
      bikeId: bike.id,
      stationId: station.id,
      status: "PENDING",
      endTime: new Date(Date.now() + env.RESERVATION_HOLD_MINUTES * 60 * 1000),
    });

    const result = await runConfirm({ reservationId: reservation.id, userId: user.id, now: new Date() });
    expectLeftTag(result, "ReservationNotOwned");
  });

  it("confirmReservationUseCase fails with ReservationMissingBike", async () => {
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();
    const reservation = await fixture.factories.reservation({
      userId: user.id,
      bikeId: null,
      stationId: station.id,
      status: "PENDING",
      endTime: new Date(Date.now() + env.RESERVATION_HOLD_MINUTES * 60 * 1000),
    });

    const result = await runConfirm({ reservationId: reservation.id, userId: user.id, now: new Date() });
    expectLeftTag(result, "ReservationMissingBike");
  });

  it("confirmReservationUseCase fails with InvalidReservationTransition", async () => {
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id });
    const reservation = await fixture.factories.reservation({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      status: "CANCELLED",
      endTime: null,
    });

    const result = await runConfirm({ reservationId: reservation.id, userId: user.id, now: new Date() });
    expectLeftTag(result, "InvalidReservationTransition");
  });

  it("confirmReservationUseCase fails with InvalidReservationTransition when reservation is expired", async () => {
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id });
    const reservation = await fixture.factories.reservation({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      status: "EXPIRED",
      endTime: new Date(Date.now() - 60_000),
    });

    const result = await runConfirm({ reservationId: reservation.id, userId: user.id, now: new Date() });
    expectLeftTag(result, "InvalidReservationTransition");
  });

  it("confirmReservationUseCase fails with InvalidReservationTransition when reservation is already fulfilled", async () => {
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id });
    const reservation = await fixture.factories.reservation({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      status: "FULFILLED",
      endTime: new Date(Date.now() + env.RESERVATION_HOLD_MINUTES * 60 * 1000),
    });

    const result = await runConfirm({ reservationId: reservation.id, userId: user.id, now: new Date() });
    expectLeftTag(result, "InvalidReservationTransition");
  });

  it("confirmReservationUseCase fails with BikeNotAvailable when the reserved bike is no longer reserved", async () => {
    const { user } = await givenUserWithWallet(fixture, { wallet: { balance: 50_000n } });
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const reservation = await fixture.factories.reservation({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      status: "PENDING",
      endTime: new Date(Date.now() + env.RESERVATION_HOLD_MINUTES * 60 * 1000),
    });

    const result = await runConfirm({ reservationId: reservation.id, userId: user.id, now: new Date() });
    expectLeftTag(result, "BikeNotAvailable");
    if (result._tag === "Left" && result.left._tag === "BikeNotAvailable") {
      expect(result.left.status).toBe("AVAILABLE");
    }
  });

  it("confirmReservationUseCase fails with ReservationConfirmBlockedByActiveRental when user already has rented bike", async () => {
    const { user } = await givenUserWithWallet(fixture, { wallet: { balance: 50000n } });
    const station = await fixture.factories.station({ capacity: 2 });
    const activeBike = await fixture.factories.bike({ stationId: station.id });
    const reservedBike = await fixture.factories.bike({ stationId: station.id });

    const reserveNow = new Date();
    const reserveResult = await runReserve({
      userId: user.id,
      bikeId: reservedBike.id,
      stationId: station.id,
      startTime: reserveNow,
      now: reserveNow,
    });
    const reservation = expectRight(reserveResult);

    await fixture.factories.rental({
      userId: user.id,
      bikeId: activeBike.id,
      startStationId: station.id,
      status: "RENTED",
    });

    const result = await runConfirm({ reservationId: reservation.id, userId: user.id, now: new Date() });
    expectLeftTag(result, "ReservationConfirmBlockedByActiveRental");
  });

  it("confirmReservationUseCase fails when wallet balance falls below the required deposit threshold", async () => {
    const { user } = await givenUserWithWallet(fixture, { wallet: { balance: 3000n } });
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 1 },
    });

    const now = new Date();
    const reserveResult = await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: now,
      now,
    });
    const reservation = expectRight(reserveResult);

    const result = await runConfirm({
      reservationId: reservation.id,
      userId: user.id,
      now,
    });

    expectLeftTag(result, "InsufficientWalletBalance");
  });

  it("cancelReservationUseCase fails with ReservationNotOwned", async () => {
    const otherUser = await fixture.factories.user();
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();
    const reservation = await fixture.factories.reservation({
      userId: otherUser.id,
      bikeId: null,
      stationId: station.id,
      status: "PENDING",
      endTime: null,
    });

    const result = await runCancel({ reservationId: reservation.id, userId: user.id, now: new Date() });
    expectLeftTag(result, "ReservationNotOwned");
  });

  it("cancelReservationUseCase fails with ReservationNotFound", async () => {
    const user = await fixture.factories.user();

    const result = await runCancel({ reservationId: uuidv7(), userId: user.id, now: new Date() });
    expectLeftTag(result, "ReservationNotFound");
  });

  it("cancelReservationUseCase fails with InvalidReservationTransition", async () => {
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();
    const reservation = await fixture.factories.reservation({
      userId: user.id,
      bikeId: null,
      stationId: station.id,
      status: "EXPIRED",
      endTime: null,
    });

    const result = await runCancel({ reservationId: reservation.id, userId: user.id, now: new Date() });
    expectLeftTag(result, "InvalidReservationTransition");
  });

  it("cancelReservationUseCase fails with InvalidReservationTransition when reservation is fulfilled", async () => {
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();
    const reservation = await fixture.factories.reservation({
      userId: user.id,
      bikeId: null,
      stationId: station.id,
      status: "FULFILLED",
      endTime: null,
    });

    const result = await runCancel({ reservationId: reservation.id, userId: user.id, now: new Date() });
    expectLeftTag(result, "InvalidReservationTransition");
  });

  it("givenPendingReservation helper creates a usable pending reservation graph", async () => {
    const scenario = await givenPendingReservation(fixture);

    const savedReservation = await fixture.prisma.reservation.findUnique({
      where: { id: scenario.reservation.id },
      select: { status: true, userId: true, bikeId: true },
    });

    expect(savedReservation).toMatchObject({
      status: "PENDING",
      userId: scenario.user.id,
      bikeId: scenario.bike.id,
    });
  });
});
