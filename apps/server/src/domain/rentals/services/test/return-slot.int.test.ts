import { Effect } from "effect";
import { beforeAll, describe, expect, it } from "vitest";

import {
  enqueueEnvironmentImpactCalculationJob,
  environmentImpactRentalDedupeKey,
  expireReturnSlots,
} from "@/domain/rentals";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { expectLeftTag, expectRight } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenActiveRental, givenStationWithAvailableBike, givenUserWithWallet } from "@/test/scenarios";

import { makeRentalRunners, makeRentalTestLayer } from "./rental-test-kit";

const SAFE_RENTAL_START_TIME = new Date("2025-01-01T10:00:00.000Z");
const SAFE_RETURN_CONFIRMED_AT = new Date("2025-01-01T10:30:00.000Z");

describe("return slot integration", () => {
  const fixture = setupPrismaIntFixture();
  let runCreateReturnSlot: ReturnType<typeof makeRentalRunners>["createReturnSlot"];
  let runGetCurrentReturnSlot: ReturnType<typeof makeRentalRunners>["getCurrentReturnSlot"];
  let runGetCurrentReturnSlotEither: ReturnType<typeof makeRentalRunners>["getCurrentReturnSlotEither"];
  let runCancelReturnSlot: ReturnType<typeof makeRentalRunners>["cancelReturnSlot"];
  let runConfirmReturn: ReturnType<typeof makeRentalRunners>["confirmReturn"];

  beforeAll(() => {
    const runners = makeRentalRunners(makeRentalTestLayer(fixture.prisma));
    runCreateReturnSlot = runners.createReturnSlot;
    runGetCurrentReturnSlot = runners.getCurrentReturnSlot;
    runGetCurrentReturnSlotEither = runners.getCurrentReturnSlotEither;
    runCancelReturnSlot = runners.cancelReturnSlot;
    runConfirmReturn = runners.confirmReturn;
  });

  it("creates and fetches an active return slot for an active rental", async () => {
    const { user, rental } = await givenActiveRental(fixture);
    const targetStation = await fixture.factories.station({ capacity: 2 });
    await fixture.factories.bike({ stationId: targetStation.id, status: "AVAILABLE" });

    const createdResult = await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: targetStation.id,
      now: new Date("2026-03-21T12:00:00.000Z"),
    });

    const created = expectRight(createdResult);
    expect(created.status).toBe("ACTIVE");
    expect(created.rentalId).toBe(rental.id);
    expect(created.userId).toBe(user.id);
    expect(created.stationId).toBe(targetStation.id);

    const current = await runGetCurrentReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      now: new Date("2026-03-21T12:01:00.000Z"),
    });

    expect(current._tag).toBe("Some");
    if (current._tag === "Some") {
      expect(current.value.id).toBe(created.id);
      expect(current.value.stationId).toBe(targetStation.id);
    }
  });

  it("reuses the existing active return slot when the station does not change", async () => {
    const { user, rental } = await givenActiveRental(fixture);
    const targetStation = await fixture.factories.station({ capacity: 2 });

    const first = expectRight(await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: targetStation.id,
    }));

    const second = expectRight(await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: targetStation.id,
    }));

    expect(second.id).toBe(first.id);

    const slots = await fixture.prisma.returnSlotReservation.findMany({ where: { rentalId: rental.id } });
    expect(slots).toHaveLength(1);
  });

  it("replaces the active return slot when the destination station changes", async () => {
    const { user, rental } = await givenActiveRental(fixture);
    const firstStation = await fixture.factories.station({ capacity: 2 });
    const secondStation = await fixture.factories.station({ capacity: 2 });

    const first = expectRight(await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: firstStation.id,
    }));

    const second = expectRight(await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: secondStation.id,
    }));

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

    expectRight(await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: targetStation.id,
    }));

    const cancelled = expectRight(await runCancelReturnSlot({
      rentalId: rental.id,
      userId: user.id,
    }));

    expect(cancelled.status).toBe("CANCELLED");

    const current = await runGetCurrentReturnSlot({ rentalId: rental.id, userId: user.id });

    expect(current._tag).toBe("None");
  });

  it("fails when the destination station has no remaining logical return capacity", async () => {
    const { user, rental } = await givenActiveRental(fixture);
    const fullStation = await fixture.factories.station({ capacity: 1 });
    await fixture.factories.bike({ stationId: fullStation.id, status: "AVAILABLE" });

    const result = await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: fullStation.id,
    });

    expectLeftTag(result, "ReturnSlotCapacityExceeded");
  });

  it("fails when logical return capacity is exhausted by another active return slot", async () => {
    const first = await givenActiveRental(fixture);
    const second = await givenActiveRental(fixture);
    const station = await fixture.factories.station({
      capacity: 10,
      returnSlotLimit: 1,
    });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    expectRight(await runCreateReturnSlot({
      rentalId: first.rental.id,
      userId: first.user.id,
      stationId: station.id,
    }));

    const result = await runCreateReturnSlot({
      rentalId: second.rental.id,
      userId: second.user.id,
      stationId: station.id,
    });

    expectLeftTag(result, "ReturnSlotCapacityExceeded");
  });

  it("ignores expired return slots when checking logical return capacity", async () => {
    const first = await givenActiveRental(fixture);
    const second = await givenActiveRental(fixture);
    const station = await fixture.factories.station({
      capacity: 10,
      returnSlotLimit: 1,
    });

    await fixture.prisma.returnSlotReservation.create({
      data: {
        rentalId: first.rental.id,
        userId: first.user.id,
        stationId: station.id,
        reservedFrom: new Date("2025-01-01T10:00:00.000Z"),
      },
    });

    const created = expectRight(await runCreateReturnSlot({
      rentalId: second.rental.id,
      userId: second.user.id,
      stationId: station.id,
      now: new Date("2025-01-01T10:31:00.000Z"),
    }));

    expect(created.stationId).toBe(station.id);
  });

  it("does not return an expired active return slot as current", async () => {
    const { user, rental } = await givenActiveRental(fixture);
    const station = await fixture.factories.station({ capacity: 2 });

    expectRight(await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: station.id,
      now: new Date("2025-01-01T10:00:00.000Z"),
    }));

    const current = await runGetCurrentReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      now: new Date("2025-01-01T10:31:00.000Z"),
    });

    expect(current._tag).toBe("None");
  });

  it("cancels an expired slot before creating a new slot for the same rental", async () => {
    const { user, rental } = await givenActiveRental(fixture);
    const firstStation = await fixture.factories.station({ capacity: 2 });
    const secondStation = await fixture.factories.station({ capacity: 2 });

    const first = expectRight(await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: firstStation.id,
      now: new Date("2025-01-01T10:00:00.000Z"),
    }));

    const second = expectRight(await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: secondStation.id,
      now: new Date("2025-01-01T10:31:00.000Z"),
    }));

    expect(second.id).not.toBe(first.id);

    const rows = await fixture.prisma.returnSlotReservation.findMany({
      where: { rentalId: rental.id },
      orderBy: { createdAt: "asc" },
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.status).toBe("CANCELLED");
    expect(rows[1]?.status).toBe("ACTIVE");
  });

  it("expires active return slots older than the configured hold window", async () => {
    const expiredRental = await givenActiveRental(fixture);
    const activeRental = await givenActiveRental(fixture);
    const station = await fixture.factories.station({ capacity: 5 });

    await fixture.prisma.returnSlotReservation.createMany({
      data: [
        {
          rentalId: expiredRental.rental.id,
          userId: expiredRental.user.id,
          stationId: station.id,
          reservedFrom: new Date("2025-01-01T10:00:00.000Z"),
        },
        {
          rentalId: activeRental.rental.id,
          userId: activeRental.user.id,
          stationId: station.id,
          reservedFrom: new Date("2025-01-01T10:45:00.000Z"),
        },
      ],
    });

    const summary = await Effect.runPromise(
      expireReturnSlots({ now: new Date("2025-01-01T10:31:00.000Z") }).pipe(
        Effect.provide(makeRentalTestLayer(fixture.prisma)),
      ),
    );

    expect(summary.expired).toBe(1);

    const rows = await fixture.prisma.returnSlotReservation.findMany({
      where: { rentalId: { in: [expiredRental.rental.id, activeRental.rental.id] } },
      orderBy: { reservedFrom: "asc" },
    });

    expect(rows[0]?.status).toBe("CANCELLED");
    expect(rows[1]?.status).toBe("ACTIVE");
  });

  it("fails when the target station does not exist", async () => {
    const { user, rental } = await givenActiveRental(fixture);

    const result = await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: "0195d86e-0861-7d56-b743-5a2264f0f999",
    });

    expectLeftTag(result, "StationNotFound");
  });

  it("fails when creating a return slot for another user's rental", async () => {
    const owner = await givenActiveRental(fixture);
    const otherUser = await givenUserWithWallet(fixture);
    const targetStation = await fixture.factories.station({ capacity: 2 });

    const result = await runCreateReturnSlot({
      rentalId: owner.rental.id,
      userId: otherUser.user.id,
      stationId: targetStation.id,
    });

    expectLeftTag(result, "RentalNotFound");
  });

  it("fails to get a return slot for another user's rental", async () => {
    const owner = await givenActiveRental(fixture);
    const otherUser = await givenUserWithWallet(fixture);
    const targetStation = await fixture.factories.station({ capacity: 2 });

    expectRight(await runCreateReturnSlot({
      rentalId: owner.rental.id,
      userId: owner.user.id,
      stationId: targetStation.id,
    }));

    const result = await runGetCurrentReturnSlotEither({
      rentalId: owner.rental.id,
      userId: otherUser.user.id,
    });

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

    const result = await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: targetStation.id,
    });

    expectLeftTag(result, "ReturnSlotRequiresActiveRental");
  });

  it("blocks creating a return slot during overnight closure", async () => {
    const { user, rental } = await givenActiveRental(fixture);
    const targetStation = await fixture.factories.station({ capacity: 2 });
    await fixture.factories.bike({ stationId: targetStation.id, status: "AVAILABLE" });

    const result = await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: targetStation.id,
      now: new Date("2026-03-21T16:00:00.000Z"),
    });

    expectLeftTag(result, "OvernightOperationsClosed");

    const activeSlot = await fixture.prisma.returnSlotReservation.findFirst({
      where: { rentalId: rental.id, status: "ACTIVE" },
    });
    expect(activeSlot).toBeNull();
  });

  it("fails to cancel when no active return slot exists", async () => {
    const { user, rental } = await givenActiveRental(fixture);

    const result = await runCancelReturnSlot({
      rentalId: rental.id,
      userId: user.id,
    });

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

    const result = await runGetCurrentReturnSlotEither({ rentalId: rental.id, userId: user.id });

    expectLeftTag(result, "ReturnSlotRequiresActiveRental");
  });

  it("finalizes the active return slot when an operator confirms the return", async () => {
    const { user, station, bike, rental } = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
      rental: { startTime: SAFE_RENTAL_START_TIME },
    });
    const operator = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: station.id });

    expectRight(await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: station.id,
    }));

    const ended = expectRight(await runConfirmReturn({
      rentalId: rental.id,
      stationId: station.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: SAFE_RETURN_CONFIRMED_AT,
    }));

    expect(ended.status).toBe("COMPLETED");

    const current = await fixture.prisma.returnSlotReservation.findFirst({
      where: { rentalId: rental.id },
      orderBy: { createdAt: "desc" },
    });
    expect(current?.status).toBe("USED");

    const confirmation = await fixture.prisma.returnConfirmation.findUnique({
      where: { rentalId: rental.id },
      select: {
        confirmedByUserId: true,
        handoverStatus: true,
      },
    });
    expect(confirmation?.confirmedByUserId).toBe(operator.id);
    expect(confirmation?.handoverStatus).toBe("CONFIRMED");

    const updatedBike = await fixture.prisma.bike.findUnique({ where: { id: bike.id } });
    expect(updatedBike?.status).toBe("AVAILABLE");
    expect(updatedBike?.stationId).toBe(station.id);
  });

  it("allows confirming a rental return without an active return slot when the station has live capacity", async () => {
    const { station, bike, rental } = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
      rental: { startTime: SAFE_RENTAL_START_TIME },
    });
    const operator = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: station.id });

    const ended = expectRight(await runConfirmReturn({
      rentalId: rental.id,
      stationId: station.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: SAFE_RETURN_CONFIRMED_AT,
    }));

    expect(ended.status).toBe("COMPLETED");

    const current = await fixture.prisma.returnSlotReservation.findFirst({
      where: { rentalId: rental.id },
    });
    expect(current).toBeNull();

    const updatedBike = await fixture.prisma.bike.findUnique({ where: { id: bike.id } });
    expect(updatedBike?.status).toBe("AVAILABLE");
    expect(updatedBike?.stationId).toBe(station.id);
  });

  it("enqueues environment impact calculation after a rental is completed", async () => {
    const { rental, station } = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
      rental: { startTime: SAFE_RENTAL_START_TIME },
    });
    const operator = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: station.id });

    const ended = expectRight(await runConfirmReturn({
      rentalId: rental.id,
      stationId: station.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: SAFE_RETURN_CONFIRMED_AT,
    }));

    expect(ended.status).toBe("COMPLETED");

    const outboxRows = await fixture.prisma.jobOutbox.findMany({
      where: { dedupeKey: environmentImpactRentalDedupeKey(rental.id) },
    });
    expect(outboxRows).toHaveLength(1);
    expect(outboxRows[0]?.type).toBe(JobTypes.EnvironmentImpactCalculateRental);
    expect(outboxRows[0]?.payload).toEqual({
      version: 1,
      rentalId: rental.id,
    });

    const impactCount = await fixture.prisma.environmentalImpactStat.count({
      where: { rentalId: rental.id },
    });
    expect(impactCount).toBe(0);
  });

  it("keeps rental completion successful when no active environment policy exists", async () => {
    const { rental, station } = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
      rental: { startTime: SAFE_RENTAL_START_TIME },
    });
    const operator = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: station.id });

    await fixture.prisma.environmentalImpactPolicy.deleteMany({});

    const ended = expectRight(await runConfirmReturn({
      rentalId: rental.id,
      stationId: station.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: SAFE_RETURN_CONFIRMED_AT,
    }));

    expect(ended.status).toBe("COMPLETED");
    await expect(
      fixture.prisma.jobOutbox.findFirstOrThrow({
        where: { dedupeKey: environmentImpactRentalDedupeKey(rental.id) },
      }),
    ).resolves.toMatchObject({
      type: JobTypes.EnvironmentImpactCalculateRental,
      status: "PENDING",
    });
  });

  it("does not enqueue environment impact calculation when completion fails", async () => {
    const { user } = await givenUserWithWallet(fixture);
    const { station, bike } = await givenStationWithAvailableBike(fixture);
    const rental = await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      status: "COMPLETED",
      endStationId: station.id,
      endTime: new Date(Date.now() - 30 * 60 * 1000),
      duration: 30,
      totalPrice: "12000",
    });
    const operator = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: station.id });

    const result = await runConfirmReturn({
      rentalId: rental.id,
      stationId: station.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: SAFE_RETURN_CONFIRMED_AT,
    });

    expectLeftTag(result, "InvalidRentalState");

    const outboxCount = await fixture.prisma.jobOutbox.count({
      where: {
        type: JobTypes.EnvironmentImpactCalculateRental,
        dedupeKey: environmentImpactRentalDedupeKey(rental.id),
      },
    });
    expect(outboxCount).toBe(0);
  });

  it("rejects confirming a rental after the late return cutoff", async () => {
    const { rental, station } = await givenActiveRental(fixture, {
      rental: {
        startTime: new Date("2026-03-22T10:00:00.000Z"),
      },
    });
    const operator = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: station.id });

    const result = await runConfirmReturn({
      rentalId: rental.id,
      stationId: station.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: new Date("2026-03-22T16:05:00.000Z"),
    });

    expectLeftTag(result, "InvalidRentalState");

    const found = await fixture.prisma.rental.findUnique({ where: { id: rental.id } });
    expect(found?.status).toBe("RENTED");
  });

  it("does not duplicate environment impact outbox jobs for the same rental", async () => {
    const { rental, station } = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
      rental: { startTime: SAFE_RENTAL_START_TIME },
    });
    const operator = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: station.id });

    expectRight(await runConfirmReturn({
      rentalId: rental.id,
      stationId: station.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: SAFE_RETURN_CONFIRMED_AT,
    }));

    await Effect.runPromise(
      enqueueEnvironmentImpactCalculationJob(fixture.prisma, {
        rentalId: rental.id,
      }),
    );

    const outboxRows = await fixture.prisma.jobOutbox.findMany({
      where: { dedupeKey: environmentImpactRentalDedupeKey(rental.id) },
    });
    expect(outboxRows).toHaveLength(1);
  });

  it("allows confirming a rental return without an active return slot when only the reservation limit is exhausted", async () => {
    const { bike, rental } = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
      rental: { startTime: SAFE_RENTAL_START_TIME },
    });
    const station = await fixture.factories.station({
      capacity: 5,
      returnSlotLimit: 0,
    });

    const operator = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: station.id });

    const ended = expectRight(await runConfirmReturn({
      rentalId: rental.id,
      stationId: station.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: SAFE_RETURN_CONFIRMED_AT,
    }));

    expect(ended.status).toBe("COMPLETED");

    const updatedBike = await fixture.prisma.bike.findUnique({ where: { id: bike.id } });
    expect(updatedBike?.status).toBe("AVAILABLE");
    expect(updatedBike?.stationId).toBe(station.id);
  });

  it("fails to confirm a rental return without an active return slot when the station has no live capacity", async () => {
    const { rental } = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
      rental: { startTime: SAFE_RENTAL_START_TIME },
    });
    const fullStation = await fixture.factories.station({
      capacity: 1,
      returnSlotLimit: 1,
    });
    await fixture.factories.bike({ stationId: fullStation.id, status: "AVAILABLE" });

    const operator = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: fullStation.id });

    const result = await runConfirmReturn({
      rentalId: rental.id,
      stationId: fullStation.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: SAFE_RETURN_CONFIRMED_AT,
    });

    expectLeftTag(result, "ReturnSlotCapacityExceeded");
  });

  it("allows confirming a rental return at a different station than the active return slot", async () => {
    const { user, rental } = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
      rental: { startTime: SAFE_RENTAL_START_TIME },
    });
    const operator = await fixture.factories.user({ role: "STAFF" });
    const reservedStation = await fixture.factories.station({ capacity: 2 });
    const attemptedStation = await fixture.factories.station({ capacity: 2 });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: attemptedStation.id });

    expectRight(await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: reservedStation.id,
    }));

    const result = await runConfirmReturn({
      rentalId: rental.id,
      stationId: attemptedStation.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: SAFE_RETURN_CONFIRMED_AT,
    });

    const completed = expectRight(result);
    expect(completed.status).toBe("COMPLETED");
    expect(completed.endStationId).toBe(attemptedStation.id);

    const slot = await fixture.prisma.returnSlotReservation.findFirst({
      where: { rentalId: rental.id },
    });
    expect(slot?.status).toBe("CANCELLED");
  });

  it("fails when the rental return is already confirmed", async () => {
    const { rental } = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
    });
    const operator = await fixture.factories.user({ role: "STAFF" });
    const station = await fixture.factories.station({ capacity: 2 });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: station.id });

    await fixture.prisma.returnSlotReservation.create({
      data: {
        rentalId: rental.id,
        userId: rental.userId,
        stationId: station.id,
        reservedFrom: new Date("2026-03-21T12:00:00.000Z"),
      },
    });

    await fixture.prisma.returnConfirmation.create({
      data: {
        rentalId: rental.id,
        stationId: station.id,
        confirmedByUserId: operator.id,
        confirmationMethod: "MANUAL",
        handoverStatus: "CONFIRMED",
        confirmedAt: new Date("2026-03-21T12:30:00.000Z"),
      },
      select: { id: true },
    });

    const result = await runConfirmReturn({
      rentalId: rental.id,
      stationId: station.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: new Date("2026-03-21T12:35:00.000Z"),
    });

    expectLeftTag(result, "ReturnAlreadyConfirmed");
  });

  it("allows a staff operator to confirm return outside their assigned station", async () => {
    const { user, rental } = await givenActiveRental(fixture, {
      wallet: { balance: 5000n },
    });
    const operator = await fixture.factories.user({ role: "STAFF" });
    const reservedStation = await fixture.factories.station({ capacity: 2 });
    const assignedStation = await fixture.factories.station({ capacity: 2 });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: assignedStation.id });

    expectRight(await runCreateReturnSlot({
      rentalId: rental.id,
      userId: user.id,
      stationId: reservedStation.id,
    }));

    const result = await runConfirmReturn({
      rentalId: rental.id,
      stationId: reservedStation.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const completed = expectRight(result);
    expect(completed.status).toBe("COMPLETED");
    expect(completed.endStationId).toBe(reservedStation.id);
  });
});
