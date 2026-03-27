import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { toPrismaDecimal } from "@/domain/shared/decimal";
import { expectLeftTag } from "@/test/effect/assertions";

import { setupReservationRepositoryIntTestKit } from "../reservation.repository.int.test-kit";

describe("reservationRepository write integration", () => {
  const kit = setupReservationRepositoryIntTestKit();
  let repo: ReturnType<typeof kit.makeRepo>;

  beforeAll(() => {
    repo = kit.makeRepo();
  });

  it("assignBikeToPendingReservation is idempotent", async () => {
    const now = new Date();
    const user = await kit.createUser();
    const station = await kit.createStation({ name: "Station F" });
    const bike = await kit.createBike({ stationId: station.id, status: "AVAILABLE" });
    const template = await kit.createFixedSlotTemplate({
      userId: user.id,
      stationId: station.id,
      slotStart: new Date(Date.UTC(2000, 0, 1, 9, 0, 0)),
    });

    const reservation = await kit.fixture.factories.reservation({
      userId: user.id,
      bikeId: null,
      stationId: station.id,
      reservationOption: "FIXED_SLOT",
      fixedSlotTemplateId: template.id,
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      endTime: null,
      prepaid: "0",
      status: "PENDING",
    });

    const firstAssign = await kit.fixture.prisma.$transaction(async (tx) => {
      const txRepo = kit.makeRepo(tx);
      return Effect.runPromise(txRepo.assignBikeToPendingReservation(reservation.id, bike.id, now));
    });

    expect(firstAssign).toBe(true);

    const secondAssign = await kit.fixture.prisma.$transaction(async (tx) => {
      const txRepo = kit.makeRepo(tx);
      return Effect.runPromise(txRepo.assignBikeToPendingReservation(reservation.id, bike.id, now));
    });

    expect(secondAssign).toBe(false);

    const updated = await Effect.runPromise(repo.findById(reservation.id));
    expect(Option.isSome(updated)).toBe(true);
    expect(Option.getOrThrow(updated).bikeId).toBe(bike.id);
  });

  it("updateStatus returns ReservationNotFound for missing id", async () => {
    const result = await Effect.runPromise(
      repo.updateStatus({
        reservationId: uuidv7(),
        status: "CANCELLED",
      }).pipe(Effect.either),
    );

    expectLeftTag(result, "ReservationNotFound");
  });

  it("createReservation maps active-bike unique constraint to ReservationUniqueViolation", async () => {
    const now = new Date();
    const user = await kit.createUser();
    const station = await kit.createStation({ name: "Station G" });
    const bike = await kit.createBike({ stationId: station.id, status: "AVAILABLE" });

    await Effect.runPromise(
      repo.createReservation({
        userId: user.id,
        bikeId: bike.id,
        stationId: station.id,
        reservationOption: "ONE_TIME",
        startTime: now,
        endTime: new Date(now.getTime() + 30 * 60 * 1000),
        prepaid: toPrismaDecimal("0"),
        status: "PENDING",
      }),
    );

    const result = await Effect.runPromise(
      repo.createReservation({
        userId: user.id,
        bikeId: bike.id,
        stationId: station.id,
        reservationOption: "ONE_TIME",
        startTime: new Date(now.getTime() + 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 90 * 60 * 1000),
        prepaid: toPrismaDecimal("0"),
        status: "PENDING",
      }).pipe(Effect.either),
    );

    expectLeftTag(result, "ReservationUniqueViolation");
  });

  it("createReservation maps fixed-slot unique constraint to ReservationUniqueViolation", async () => {
    const now = new Date();
    const user = await kit.createUser();
    const station = await kit.createStation({ name: "Station H" });
    const template = await kit.createFixedSlotTemplate({
      userId: user.id,
      stationId: station.id,
      slotStart: new Date(Date.UTC(2000, 0, 1, 7, 0, 0)),
    });
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await Effect.runPromise(
      repo.createReservation({
        userId: user.id,
        bikeId: null,
        stationId: station.id,
        reservationOption: "FIXED_SLOT",
        fixedSlotTemplateId: template.id,
        startTime,
        endTime: null,
        prepaid: toPrismaDecimal("0"),
        status: "PENDING",
      }),
    );

    const result = await Effect.runPromise(
      repo.createReservation({
        userId: user.id,
        bikeId: null,
        stationId: station.id,
        reservationOption: "FIXED_SLOT",
        fixedSlotTemplateId: template.id,
        startTime,
        endTime: null,
        prepaid: toPrismaDecimal("0"),
        status: "PENDING",
      }).pipe(Effect.either),
    );

    expectLeftTag(result, "ReservationUniqueViolation");
  });

  it("createReservation maps active-user unique constraint to ReservationUniqueViolation", async () => {
    const now = new Date();
    const user = await kit.createUser();
    const station = await kit.createStation({ name: "Station I" });
    const bikeA = await kit.createBike({ stationId: station.id, status: "AVAILABLE" });
    const bikeB = await kit.createBike({ stationId: station.id, status: "AVAILABLE" });

    await Effect.runPromise(
      repo.createReservation({
        userId: user.id,
        bikeId: bikeA.id,
        stationId: station.id,
        reservationOption: "ONE_TIME",
        startTime: now,
        endTime: new Date(now.getTime() + 30 * 60 * 1000),
        prepaid: toPrismaDecimal("0"),
        status: "PENDING",
      }),
    );

    const result = await Effect.runPromise(
      repo.createReservation({
        userId: user.id,
        bikeId: bikeB.id,
        stationId: station.id,
        reservationOption: "ONE_TIME",
        startTime: new Date(now.getTime() + 1000),
        endTime: new Date(now.getTime() + 60 * 60 * 1000),
        prepaid: toPrismaDecimal("0"),
        status: "PENDING",
      }).pipe(Effect.either),
    );

    expectLeftTag(result, "ReservationUniqueViolation");
  });
});
