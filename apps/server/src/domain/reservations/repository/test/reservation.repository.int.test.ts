import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { BikeStatus } from "generated/prisma/client";

import { toPrismaDecimal } from "@/domain/shared/decimal";
import { getTestDatabase } from "@/test/db/test-database";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { PrismaClient } from "generated/prisma/client";

import { makeReservationRepository } from "../reservation.repository";

async function createStation(client: PrismaClient, args: {
  name: string;
  latitude?: number;
  longitude?: number;
}) {
  const id = uuidv7();
  const address = "123 Test St";
  const capacity = 10;
  const updatedAt = new Date();
  const latitude = args.latitude ?? 10.0;
  const longitude = args.longitude ?? 20.0;

  await client.$executeRaw`
    INSERT INTO "Station" (
      "id",
      "name",
      "address",
      "capacity",
      "latitude",
      "longitude",
      "updated_at",
      "position"
    ) VALUES (
      ${id},
      ${args.name},
      ${address},
      ${capacity},
      ${latitude},
      ${longitude},
      ${updatedAt},
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
    )
  `;

  return { id };
}

async function createUser(client: PrismaClient) {
  const id = uuidv7();
  await client.user.create({
    data: {
      id,
      fullname: "Test User",
      email: `user-${id}@example.com`,
      passwordHash: "hash",
      role: "USER",
      verify: "VERIFIED",
    },
  });

  return { id };
}

async function createBike(
  client: PrismaClient,
  args: { stationId: string; status?: BikeStatus },
) {
  const id = uuidv7();
  await client.bike.create({
    data: {
      id,
      chipId: `chip-${id}`,
      stationId: args.stationId,
      status: args.status ?? "AVAILABLE",
      updatedAt: new Date(),
    },
  });

  return { id };
}

async function createFixedSlotTemplate(client: PrismaClient, args: {
  userId: string;
  stationId: string;
  slotStart: Date;
}) {
  const template = await client.fixedSlotTemplate.create({
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

  return template;
}

describe("reservationRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeReservationRepository>;

  beforeAll(async () => {
    container = await getTestDatabase();

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    repo = makeReservationRepository(client);
  }, 60000);

  afterEach(async () => {
    await client.reservation.deleteMany({});
    await client.fixedSlotDate.deleteMany({});
    await client.fixedSlotTemplate.deleteMany({});
    await client.bike.deleteMany({});
    await client.station.deleteMany({});
    await client.user.deleteMany({});
  });

  afterAll(async () => {
    if (client)
      await client.$disconnect();
    if (container)
      await container.stop();
  });

  it("findPendingHoldByUserIdNow returns current holds", async () => {
    const now = new Date();
    const user = await createUser(client);
    const station = await createStation(client, { name: "Station A" });
    const bike = await createBike(client, { stationId: station.id, status: "AVAILABLE" });

    await client.reservation.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        bikeId: bike.id,
        stationId: station.id,
        reservationOption: "ONE_TIME",
        startTime: new Date(now.getTime() - 10 * 60 * 1000),
        endTime: new Date(now.getTime() + 10 * 60 * 1000),
        prepaid: "0",
        status: "PENDING",
        updatedAt: now,
      },
    });

    const result = await Effect.runPromise(repo.findPendingHoldByUserIdNow(user.id, now));

    expect(Option.isSome(result)).toBe(true);
  });

  it("findPendingHoldByBikeIdNow ignores fixed-slot with endTime null", async () => {
    const now = new Date();
    const user = await createUser(client);
    const station = await createStation(client, { name: "Station B" });
    const bike = await createBike(client, { stationId: station.id, status: "AVAILABLE" });

    await client.reservation.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        bikeId: bike.id,
        stationId: station.id,
        reservationOption: "FIXED_SLOT",
        startTime: new Date(now.getTime() + 30 * 60 * 1000),
        endTime: null,
        prepaid: "0",
        status: "PENDING",
        updatedAt: now,
      },
    });

    const result = await Effect.runPromise(repo.findPendingHoldByBikeIdNow(bike.id, now));

    expect(Option.isNone(result)).toBe(true);
  });

  it("findLatestPendingOrActiveByUserId returns most recently updated pending/active", async () => {
    const user = await createUser(client);
    const station = await createStation(client, { name: "Station C" });
    const bikeA = await createBike(client, { stationId: station.id, status: "AVAILABLE" });
    const bikeB = await createBike(client, { stationId: station.id, status: "AVAILABLE" });

    const older = new Date(Date.now() - 60 * 60 * 1000);
    const newer = new Date();

    await client.reservation.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        bikeId: bikeA.id,
        stationId: station.id,
        reservationOption: "ONE_TIME",
        startTime: older,
        endTime: new Date(older.getTime() + 60 * 60 * 1000),
        prepaid: "0",
        // NOTE: With `idx_reservations_active_user`, we can no longer create multiple
        // reservations in PENDING/ACTIVE for the same user.
        // TODO(reservations/fixed-slot): Revisit test strategy when FIXED_SLOT is implemented end-to-end
        // and we finalize whether the constraint should be scoped (e.g. only `bike_id IS NOT NULL`).
        status: "CANCELLED",
        updatedAt: older,
      },
    });

    const active = await client.reservation.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        bikeId: bikeB.id,
        stationId: station.id,
        reservationOption: "ONE_TIME",
        startTime: newer,
        endTime: new Date(newer.getTime() + 60 * 60 * 1000),
        prepaid: "0",
        status: "ACTIVE",
        updatedAt: newer,
      },
      select: { id: true },
    });

    const result = await Effect.runPromise(repo.findLatestPendingOrActiveByUserId(user.id));

    expect(Option.isSome(result)).toBe(true);
    expect(Option.getOrThrow(result).id).toBe(active.id);
  });

  it.skip("findNextUpcomingByUserId respects onlyFixedSlot option", async () => {
    // TODO(reservations/fixed-slot): This test requires creating both a normal hold (bike_id != null)
    // and a FIXED_SLOT reservation (bike_id = null) for the same user in PENDING/ACTIVE.
    // With the current DB constraint `idx_reservations_active_user`, this is not possible.
    // Re-enable once we finalize fixed-slot semantics and adjust the constraint accordingly.
  });

  it("findPendingFixedSlotByTemplateAndStartInTx + assignBikeToPendingReservationInTx are idempotent", async () => {
    const now = new Date();
    const user = await createUser(client);
    const station = await createStation(client, { name: "Station E" });
    const bike = await createBike(client, { stationId: station.id, status: "AVAILABLE" });
    const template = await createFixedSlotTemplate(client, {
      userId: user.id,
      stationId: station.id,
      slotStart: new Date(Date.UTC(2000, 0, 1, 9, 0, 0)),
    });
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const reservation = await client.reservation.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        bikeId: null,
        stationId: station.id,
        reservationOption: "FIXED_SLOT",
        fixedSlotTemplateId: template.id,
        startTime,
        endTime: null,
        prepaid: "0",
        status: "PENDING",
        updatedAt: now,
      },
      select: { id: true },
    });

    const found = await client.$transaction(async tx =>
      Effect.runPromise(repo.findPendingFixedSlotByTemplateAndStartInTx(tx, template.id, startTime)),
    );
    expect(Option.isSome(found)).toBe(true);
    expect(Option.getOrThrow(found).id).toBe(reservation.id);

    const firstAssign = await client.$transaction(async tx =>
      Effect.runPromise(repo.assignBikeToPendingReservationInTx(tx, reservation.id, bike.id, now)),
    );
    expect(firstAssign).toBe(true);

    const secondAssign = await client.$transaction(async tx =>
      Effect.runPromise(repo.assignBikeToPendingReservationInTx(tx, reservation.id, bike.id, now)),
    );
    expect(secondAssign).toBe(false);
  });

  it("updateStatus returns ReservationNotFound for missing id", async () => {
    const result = await Effect.runPromise(
      repo.updateStatus({
        reservationId: uuidv7(),
        status: "CANCELLED",
      }).pipe(Effect.either),
    );

    if (Either.isRight(result)) {
      throw new Error("Expected ReservationNotFound but got success");
    }

    expect(result.left._tag).toBe("ReservationNotFound");
  });

  it("returns ReservationRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    const brokenRepo = makeReservationRepository(broken.client);

    const result = await Effect.runPromise(
      brokenRepo.findById(uuidv7()).pipe(Effect.either),
    );

    if (Either.isRight(result)) {
      throw new Error("Expected failure but got success");
    }
    expect(result.left._tag).toBe("ReservationRepositoryError");

    await broken.stop();
  });

  it("createReservation maps active-bike unique constraint to ReservationUniqueViolation", async () => {
    const now = new Date();
    const user = await createUser(client);
    const station = await createStation(client, { name: "Station F" });
    const bike = await createBike(client, { stationId: station.id, status: "AVAILABLE" });

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

    if (Either.isRight(result)) {
      throw new Error("Expected ReservationUniqueViolation but got success");
    }

    expect(result.left._tag).toBe("ReservationUniqueViolation");
  });

  it("createReservation maps fixed-slot unique constraint to ReservationUniqueViolation", async () => {
    const now = new Date();
    const user = await createUser(client);
    const station = await createStation(client, { name: "Station G" });
    const template = await createFixedSlotTemplate(client, {
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

    if (Either.isRight(result)) {
      throw new Error("Expected ReservationUniqueViolation but got success");
    }

    expect(result.left._tag).toBe("ReservationUniqueViolation");
  });

  it("createReservation maps active-user unique constraint to ReservationUniqueViolation", async () => {
    const now = new Date();
    const user = await createUser(client);
    const station = await createStation(client, { name: "Station H" });
    const bikeA = await createBike(client, { stationId: station.id, status: "AVAILABLE" });
    const bikeB = await createBike(client, { stationId: station.id, status: "AVAILABLE" });

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

    if (Either.isRight(result)) {
      throw new Error("Expected ReservationUniqueViolation (User Double-Booking) but got success");
    }

    expect(result.left._tag).toBe("ReservationUniqueViolation");
  });
});
