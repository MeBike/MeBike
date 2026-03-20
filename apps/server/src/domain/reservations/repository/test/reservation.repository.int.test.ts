import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { toPrismaDecimal } from "@/domain/shared/decimal";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectLeftTag } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeReservationRepository } from "../reservation.repository";

describe("reservationRepository Integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeReservationRepository>;

  beforeAll(() => {
    repo = makeReservationRepository(fixture.prisma);
  });

  async function createStation(args: {
    name: string;
    latitude?: number;
    longitude?: number;
  }) {
    return fixture.factories.station({
      name: args.name,
      latitude: args.latitude ?? 10.0,
      longitude: args.longitude ?? 20.0,
    });
  }

  async function createUser() {
    const user = await fixture.factories.user({ fullname: "Test User" });
    return { id: user.id };
  }

  async function createBike(args: { stationId: string; status?: "AVAILABLE" | "BOOKED" | "BROKEN" | "RESERVED" | "MAINTAINED" | "UNAVAILABLE" }) {
    const bike = await fixture.factories.bike({
      stationId: args.stationId,
      status: args.status ?? "AVAILABLE",
    });

    return { id: bike.id };
  }

  async function createFixedSlotTemplate(args: {
    userId: string;
    stationId: string;
    slotStart: Date;
  }) {
    return fixture.prisma.fixedSlotTemplate.create({
      data: {
        id: uuidv7(),
        userId: args.userId,
        stationId: args.stationId,
        slotStart: args.slotStart,
        status: "ACTIVE",
        updatedAt: new Date(),
      },
      select: { id: true },
    });
  }

  it("findPendingHoldByUserIdNow returns current holds", async () => {
    const now = new Date();
    const user = await createUser();
    const station = await createStation({ name: "Station A" });
    const bike = await createBike({ stationId: station.id, status: "AVAILABLE" });

    await fixture.factories.reservation({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      reservationOption: "ONE_TIME",
      startTime: new Date(now.getTime() - 10 * 60 * 1000),
      endTime: new Date(now.getTime() + 10 * 60 * 1000),
      prepaid: "0",
      status: "PENDING",
    });

    const result = await Effect.runPromise(repo.findPendingHoldByUserIdNow(user.id, now));

    expect(Option.isSome(result)).toBe(true);
  });

  it("findPendingHoldByBikeIdNow ignores fixed-slot with endTime null", async () => {
    const now = new Date();
    const user = await createUser();
    const station = await createStation({ name: "Station B" });
    const bike = await createBike({ stationId: station.id, status: "AVAILABLE" });

    await fixture.factories.reservation({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      reservationOption: "FIXED_SLOT",
      startTime: new Date(now.getTime() + 30 * 60 * 1000),
      endTime: null,
      prepaid: "0",
      status: "PENDING",
    });

    const result = await Effect.runPromise(repo.findPendingHoldByBikeIdNow(bike.id, now));

    expect(Option.isNone(result)).toBe(true);
  });

  it("findLatestPendingOrActiveByUserId returns most recently updated pending/active", async () => {
    const user = await createUser();
    const station = await createStation({ name: "Station C" });
    const bikeA = await createBike({ stationId: station.id, status: "AVAILABLE" });
    const bikeB = await createBike({ stationId: station.id, status: "AVAILABLE" });

    const older = new Date(Date.now() - 60 * 60 * 1000);
    const newer = new Date();

    await fixture.factories.reservation({
      userId: user.id,
      bikeId: bikeA.id,
      stationId: station.id,
      reservationOption: "ONE_TIME",
      startTime: older,
      endTime: new Date(older.getTime() + 60 * 60 * 1000),
      prepaid: "0",
      status: "CANCELLED",
    });

    const active = await fixture.prisma.reservation.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        bikeId: bikeB.id,
        stationId: station.id,
        reservationOption: "ONE_TIME",
        startTime: newer,
        endTime: new Date(newer.getTime() + 60 * 60 * 1000),
        prepaid: toPrismaDecimal("0"),
        status: "ACTIVE",
        updatedAt: newer,
      },
      select: { id: true },
    });

    const result = await Effect.runPromise(repo.findLatestPendingOrActiveByUserId(user.id));

    expect(Option.isSome(result)).toBe(true);
    expect(Option.getOrThrow(result).id).toBe(active.id);
  });

  it("listForAdmin supports global listing with user filters", async () => {
    const station = await createStation({ name: "Station D" });
    const userA = await createUser();
    const userB = await createUser();
    const bikeA = await createBike({ stationId: station.id, status: "AVAILABLE" });
    const bikeB = await createBike({ stationId: station.id, status: "AVAILABLE" });
    const now = new Date();

    await fixture.factories.reservation({
      userId: userA.id,
      bikeId: bikeA.id,
      stationId: station.id,
      reservationOption: "ONE_TIME",
      startTime: new Date(now.getTime() - 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 60 * 60 * 1000),
      prepaid: "0",
      status: "CANCELLED",
    });

    await fixture.factories.reservation({
      userId: userB.id,
      bikeId: bikeB.id,
      stationId: station.id,
      reservationOption: "ONE_TIME",
      startTime: new Date(now.getTime() - 30 * 60 * 1000),
      endTime: new Date(now.getTime() + 90 * 60 * 1000),
      prepaid: "0",
      status: "CANCELLED",
    });

    const result = await Effect.runPromise(
      repo.listForAdmin(
        { userId: userA.id },
        {
          page: 1,
          pageSize: 10,
          sortBy: "startTime",
          sortDir: "desc",
        },
      ),
    );

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].userId).toBe(userA.id);
  });

  it.skip("findNextUpcomingByUserId respects onlyFixedSlot option", async () => {
    // TODO(reservations/fixed-slot): This test requires creating both a normal hold (bike_id != null)
    // and a FIXED_SLOT reservation (bike_id = null) for the same user in PENDING/ACTIVE.
    // With the current DB constraint `idx_reservations_active_user`, this is not possible.
    // Re-enable once we finalize fixed-slot semantics and adjust the constraint accordingly.
  });

  it("findPendingFixedSlotByTemplateAndStart + assignBikeToPendingReservation are idempotent", async () => {
    const now = new Date();
    const user = await createUser();
    const station = await createStation({ name: "Station E" });
    const bike = await createBike({ stationId: station.id, status: "AVAILABLE" });
    const template = await createFixedSlotTemplate({
      userId: user.id,
      stationId: station.id,
      slotStart: new Date(Date.UTC(2000, 0, 1, 9, 0, 0)),
    });
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const reservation = await fixture.factories.reservation({
      userId: user.id,
      bikeId: null,
      stationId: station.id,
      reservationOption: "FIXED_SLOT",
      fixedSlotTemplateId: template.id,
      startTime,
      endTime: null,
      prepaid: "0",
      status: "PENDING",
    });

    const found = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeReservationRepository(tx);
      return Effect.runPromise(txRepo.findPendingFixedSlotByTemplateAndStart(template.id, startTime));
    });
    expect(Option.isSome(found)).toBe(true);
    expect(Option.getOrThrow(found).id).toBe(reservation.id);

    const firstAssign = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeReservationRepository(tx);
      return Effect.runPromise(txRepo.assignBikeToPendingReservation(reservation.id, bike.id, now));
    });
    expect(firstAssign).toBe(true);

    const secondAssign = await fixture.prisma.$transaction(async (tx) => {
      const txRepo = makeReservationRepository(tx);
      return Effect.runPromise(txRepo.assignBikeToPendingReservation(reservation.id, bike.id, now));
    });
    expect(secondAssign).toBe(false);
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

  it("returns ReservationRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    try {
      const brokenRepo = makeReservationRepository(broken.client);

      const result = await Effect.runPromise(
        brokenRepo.findById(uuidv7()).pipe(Effect.either),
      );

      expectLeftTag(result, "ReservationRepositoryError");
    }
    finally {
      await broken.stop();
    }
  });

  it("createReservation maps active-bike unique constraint to ReservationUniqueViolation", async () => {
    const now = new Date();
    const user = await createUser();
    const station = await createStation({ name: "Station F" });
    const bike = await createBike({ stationId: station.id, status: "AVAILABLE" });

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
    const user = await createUser();
    const station = await createStation({ name: "Station G" });
    const template = await createFixedSlotTemplate({
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
    const user = await createUser();
    const station = await createStation({ name: "Station H" });
    const bikeA = await createBike({ stationId: station.id, status: "AVAILABLE" });
    const bikeB = await createBike({ stationId: station.id, status: "AVAILABLE" });

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
