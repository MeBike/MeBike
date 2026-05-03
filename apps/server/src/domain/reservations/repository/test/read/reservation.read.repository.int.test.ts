import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { ReservationRepositoryError } from "@/domain/reservations/domain-errors";
import { toPrismaDecimal } from "@/domain/shared/decimal";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectDefect } from "@/test/effect/assertions";

import { setupReservationRepositoryIntTestKit } from "../reservation.repository.int.test-kit";

describe("reservationRepository read integration", () => {
  const kit = setupReservationRepositoryIntTestKit();
  let repo: ReturnType<typeof kit.makeRepo>;

  beforeAll(() => {
    repo = kit.makeRepo();
  });

  it("findPendingHoldByUserIdNow returns current holds", async () => {
    const now = new Date();
    const user = await kit.createUser();
    const station = await kit.createStation({ name: "Station A" });
    const bike = await kit.createBike({ stationId: station.id, status: "AVAILABLE" });

    await kit.fixture.factories.reservation({
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

  it("findPendingHoldByBikeIdNow ignores fixed-slot before hold window starts", async () => {
    const now = new Date();
    const user = await kit.createUser();
    const station = await kit.createStation({ name: "Station B" });
    const bike = await kit.createBike({ stationId: station.id, status: "AVAILABLE" });

    await kit.fixture.factories.reservation({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      reservationOption: "FIXED_SLOT",
      startTime: new Date(now.getTime() + 30 * 60 * 1000),
      endTime: new Date(now.getTime() + 60 * 60 * 1000),
      prepaid: "0",
      status: "PENDING",
    });

    const result = await Effect.runPromise(repo.findPendingHoldByBikeIdNow(bike.id, now));

    expect(Option.isNone(result)).toBe(true);
  });

  it("findLatestPendingOrActiveByUserId returns most recently updated pending reservation", async () => {
    const user = await kit.createUser();
    const station = await kit.createStation({ name: "Station C" });
    const bikeA = await kit.createBike({ stationId: station.id, status: "AVAILABLE" });
    const bikeB = await kit.createBike({ stationId: station.id, status: "AVAILABLE" });

    const older = new Date(Date.now() - 60 * 60 * 1000);
    const newer = new Date();

    await kit.fixture.factories.reservation({
      userId: user.id,
      bikeId: bikeA.id,
      stationId: station.id,
      reservationOption: "ONE_TIME",
      startTime: older,
      endTime: new Date(older.getTime() + 60 * 60 * 1000),
      prepaid: "0",
      status: "CANCELLED",
    });

    const pending = await kit.fixture.prisma.reservation.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        bikeId: bikeB.id,
        stationId: station.id,
        reservationOption: "ONE_TIME",
        startTime: newer,
        endTime: new Date(newer.getTime() + 60 * 60 * 1000),
        prepaid: toPrismaDecimal("0"),
        status: "PENDING",
        updatedAt: newer,
      },
      select: { id: true },
    });

    const result = await Effect.runPromise(repo.findLatestPendingOrActiveByUserId(user.id));

    expect(Option.isSome(result)).toBe(true);
    expect(Option.getOrThrow(result).id).toBe(pending.id);
  });

  it("listForAdmin supports global listing with user filters", async () => {
    const station = await kit.createStation({ name: "Station D" });
    const userA = await kit.createUser();
    const userB = await kit.createUser();
    const bikeA = await kit.createBike({ stationId: station.id, status: "AVAILABLE" });
    const bikeB = await kit.createBike({ stationId: station.id, status: "AVAILABLE" });
    const now = new Date();

    await kit.fixture.factories.reservation({
      userId: userA.id,
      bikeId: bikeA.id,
      stationId: station.id,
      reservationOption: "ONE_TIME",
      startTime: new Date(now.getTime() - 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 60 * 60 * 1000),
      prepaid: "0",
      status: "CANCELLED",
    });

    await kit.fixture.factories.reservation({
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

  it("findPendingFixedSlotByTemplateAndStart returns matching pending reservation", async () => {
    const now = new Date();
    const user = await kit.createUser();
    const station = await kit.createStation({ name: "Station E" });
    const template = await kit.createFixedSlotTemplate({
      userId: user.id,
      stationId: station.id,
      slotStart: new Date(Date.UTC(2000, 0, 1, 9, 0, 0)),
    });
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const reservation = await kit.fixture.factories.reservation({
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

    const found = await kit.fixture.prisma.$transaction(async (tx) => {
      const txRepo = kit.makeRepo(tx);
      return Effect.runPromise(txRepo.findPendingFixedSlotByTemplateAndStart(template.id, startTime));
    });

    expect(Option.isSome(found)).toBe(true);
    expect(Option.getOrThrow(found).id).toBe(reservation.id);
  });

  it("findPendingFixedSlotByTemplateAndStart also returns already-assigned pending reservation", async () => {
    const now = new Date();
    const user = await kit.createUser();
    const station = await kit.createStation({ name: "Station E Assigned" });
    const bike = await kit.createBike({ stationId: station.id, status: "AVAILABLE" });
    const template = await kit.createFixedSlotTemplate({
      userId: user.id,
      stationId: station.id,
      slotStart: new Date(Date.UTC(2000, 0, 1, 9, 0, 0)),
    });
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const reservation = await kit.fixture.factories.reservation({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      reservationOption: "FIXED_SLOT",
      fixedSlotTemplateId: template.id,
      startTime,
      endTime: null,
      prepaid: "0",
      status: "PENDING",
    });

    const found = await kit.fixture.prisma.$transaction(async (tx) => {
      const txRepo = kit.makeRepo(tx);
      return Effect.runPromise(txRepo.findPendingFixedSlotByTemplateAndStart(template.id, startTime));
    });

    expect(Option.isSome(found)).toBe(true);
    expect(Option.getOrThrow(found).id).toBe(reservation.id);
  });

  it("listActiveFixedSlotTemplatesByDate returns active templates scheduled for slot date", async () => {
    const slotDate = new Date(Date.UTC(2026, 3, 14));
    const otherDate = new Date(Date.UTC(2026, 3, 15));
    const user = await kit.createUser();
    const station = await kit.createStation({ name: "Station Fixed Slot Query" });
    const activeTemplate = await kit.fixture.prisma.fixedSlotTemplate.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        stationId: station.id,
        slotStart: new Date(Date.UTC(2000, 0, 1, 9, 0, 0)),
        status: "ACTIVE",
        updatedAt: new Date(),
        dates: {
          create: [{ id: uuidv7(), slotDate }],
        },
      },
      select: { id: true },
    });

    await kit.fixture.prisma.fixedSlotTemplate.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        stationId: station.id,
        slotStart: new Date(Date.UTC(2000, 0, 1, 10, 0, 0)),
        status: "CANCELLED",
        updatedAt: new Date(),
        dates: {
          create: [{ id: uuidv7(), slotDate }],
        },
      },
      select: { id: true },
    });

    await kit.fixture.prisma.fixedSlotTemplate.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        stationId: station.id,
        slotStart: new Date(Date.UTC(2000, 0, 1, 11, 0, 0)),
        status: "ACTIVE",
        updatedAt: new Date(),
        dates: {
          create: [{ id: uuidv7(), slotDate: otherDate }],
        },
      },
      select: { id: true },
    });

    const templates = await Effect.runPromise(repo.listActiveFixedSlotTemplatesByDate(slotDate));

    expect(templates).toHaveLength(1);
    expect(templates[0]?.id).toBe(activeTemplate.id);
    expect(templates[0]?.user.email).toBeDefined();
    expect(templates[0]?.station.name).toBe(station.name);
  });

  it("defects with ReservationRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    try {
      const brokenRepo = kit.makeRepo(broken.client);

      await expectDefect(
        brokenRepo.findById(uuidv7()),
        ReservationRepositoryError,
        { operation: "findById" },
      );
    }
    finally {
      await broken.stop();
    }
  });
});
