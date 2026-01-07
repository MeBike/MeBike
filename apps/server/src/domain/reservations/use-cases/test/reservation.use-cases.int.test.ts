import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either, Layer } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type {
  ReservationHoldServiceTag,
  ReservationServiceTag,
} from "@/domain/reservations";
import type { SubscriptionServiceTag } from "@/domain/subscriptions/services/subscription.service";
import type { WalletServiceTag } from "@/domain/wallets/services/wallet.service";

import { env } from "@/config/env";
import { BikeRepository, makeBikeRepository } from "@/domain/bikes";
import { makeRentalRepository, RentalRepository } from "@/domain/rentals";
import {
  cancelReservationUseCase,
  confirmReservationUseCase,
  makeReservationRepository,
  ReservationHoldServiceLive,
  ReservationRepository,
  ReservationServiceLive,
  reserveBikeUseCase,
} from "@/domain/reservations";
import { makeStationRepository, StationRepository } from "@/domain/stations";
import { SubscriptionRepository } from "@/domain/subscriptions";
import { makeSubscriptionRepository } from "@/domain/subscriptions/repository/subscription.repository";
import { SubscriptionServiceLive } from "@/domain/subscriptions/services/subscription.service";
import { makeUserRepository, UserRepository } from "@/domain/users";
import { makeWalletRepository, WalletRepository } from "@/domain/wallets";
import { WalletServiceLive } from "@/domain/wallets/services/wallet.service";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { Prisma } from "@/infrastructure/prisma";

import { getTestDatabase } from "@/test/db/test-database";
import { PrismaClient } from "generated/prisma/client";

type TestContainer = { stop: () => Promise<void>; url: string };

describe("reservation use-cases integration", () => {
  let container: TestContainer;
  let client: PrismaClient;
  type ReservationDeps
    = | Prisma
      | ReservationRepository
      | ReservationServiceTag
      | ReservationHoldServiceTag
      | BikeRepository
      | StationRepository
      | UserRepository
      | WalletRepository
      | WalletServiceTag
      | SubscriptionRepository
      | SubscriptionServiceTag
      | RentalRepository;
  let depsLayer: Layer.Layer<ReservationDeps>;

  beforeAll(async () => {
    container = await getTestDatabase();
    

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });

    const reservationRepo = makeReservationRepository(client);
    const bikeRepo = makeBikeRepository(client);
    const stationRepo = makeStationRepository(client);
    const userRepo = makeUserRepository(client);
    const walletRepo = makeWalletRepository(client);
    const subscriptionRepo = makeSubscriptionRepository(client);
    const rentalRepo = makeRentalRepository(client);

    const prismaLayer = Layer.succeed(Prisma, Prisma.make({ client }));
    const reservationRepoLayer = Layer.succeed(ReservationRepository, reservationRepo);
    const reservationServiceLayer = ReservationServiceLive.pipe(
      Layer.provide(reservationRepoLayer),
    );
    const reservationHoldLayer = ReservationHoldServiceLive.pipe(
      Layer.provide(reservationRepoLayer),
    );
    const walletRepoLayer = Layer.succeed(WalletRepository, walletRepo);
    const walletServiceLayer = WalletServiceLive.pipe(
      Layer.provide(walletRepoLayer),
    );
    const subscriptionRepoLayer = Layer.succeed(SubscriptionRepository, subscriptionRepo);
    const subscriptionServiceLayer = SubscriptionServiceLive.pipe(
      Layer.provide(subscriptionRepoLayer),
    );

    depsLayer = Layer.mergeAll(
      prismaLayer,
      reservationRepoLayer,
      reservationServiceLayer,
      reservationHoldLayer,
      Layer.succeed(BikeRepository, BikeRepository.make(bikeRepo)),
      Layer.succeed(StationRepository, StationRepository.make(stationRepo)),
      Layer.succeed(UserRepository, UserRepository.make(userRepo)),
      walletRepoLayer,
      walletServiceLayer,
      subscriptionRepoLayer,
      subscriptionServiceLayer,
      Layer.succeed(RentalRepository, RentalRepository.make(rentalRepo)),
    );
  }, 60000);

  afterEach(async () => {
    await client.jobOutbox.deleteMany({});
    await client.rental.deleteMany({});
    await client.reservation.deleteMany({});
    await client.walletTransaction.deleteMany({});
    await client.wallet.deleteMany({});
    await client.subscription.deleteMany({});
    await client.bike.deleteMany({});
    await client.station.deleteMany({});
    await client.user.deleteMany({});
  });

  afterAll(async () => {
    if (client) {
      await client.$disconnect();
    }
    if (container) {
      await container.stop();
    }
  });

  const provideDeps = <A, E>(
    eff: Effect.Effect<A, E, ReservationDeps>,
  ) => eff.pipe(Effect.provide(depsLayer));

  const createUser = async () => {
    const id = uuidv7();
    const email = `reservation-${id}@example.com`;
    await client.user.create({
      data: {
        id,
        fullname: "Reservation User",
        email,
        passwordHash: "hash",
        role: "USER",
        verify: "VERIFIED",
      },
    });
    return { id, email };
  };

  const createStation = async (name?: string) => {
    const id = uuidv7();
    const address = "123 Test St";
    const capacity = 10;
    const latitude = 10.762622;
    const longitude = 106.660172;
    const updatedAt = new Date();
    const stationName = name ?? `Station ${id}`;

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
        ${stationName},
        ${address},
        ${capacity},
        ${latitude},
        ${longitude},
        ${updatedAt},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      )
    `;

    return { id };
  };

  const createBike = async (args: { stationId: string; status?: "AVAILABLE" | "RESERVED" | "BOOKED" }) => {
    const id = uuidv7();
    await client.bike.create({
      data: {
        id,
        chipId: `chip-${id}`,
        stationId: args.stationId,
        supplierId: null,
        status: args.status ?? "AVAILABLE",
        updatedAt: new Date(),
      },
    });
    return { id };
  };

  const createWallet = async (userId: string, balance: bigint) => {
    await client.wallet.create({
      data: {
        userId,
        balance,
        status: "ACTIVE",
      },
    });
  };

  const runReserve = (args: {
    userId: string;
    bikeId: string;
    stationId: string;
    startTime: Date;
    now: Date;
  }) =>
    Effect.runPromise(
      provideDeps(
        reserveBikeUseCase({
          userId: args.userId,
          bikeId: args.bikeId,
          stationId: args.stationId,
          startTime: args.startTime,
          reservationOption: "ONE_TIME",
          now: args.now,
        }).pipe(Effect.either),
      ),
    );

  const expectLeftTag = <E extends { _tag: string }>(
    result: Either.Either<unknown, E>,
    tag: E["_tag"],
  ) => {
    if (Either.isRight(result)) {
      throw new Error(`Expected Left ${tag}, got Right`);
    }
    expect(result.left._tag).toBe(tag);
  };

  it("reserveBikeUseCase creates hold + rental + outbox jobs and reserves bike", async () => {
    const { id: userId, email } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });
    await createWallet(userId, 50000n);

    const now = new Date("2025-01-01T10:00:00.000Z");
    const startTime = new Date("2025-01-01T10:00:00.000Z");

    const result = await runReserve({ userId, bikeId, stationId, startTime, now });

    if (Either.isLeft(result)) {
      throw new Error(`Expected Right, got ${result.left._tag}`);
    }

    const reservation = result.right;
    expect(reservation.status).toBe("PENDING");
    expect(reservation.userId).toBe(userId);
    expect(reservation.bikeId).toBe(bikeId);
    expect(reservation.stationId).toBe(stationId);

    const rental = await client.rental.findUnique({ where: { id: reservation.id } });
    expect(rental?.status).toBe("RESERVED");

    const bike = await client.bike.findUnique({ where: { id: bikeId } });
    expect(bike?.status).toBe("RESERVED");

    const endTimeMs = startTime.getTime() + env.RESERVATION_HOLD_MINUTES * 60 * 1000;
    const notifyAtMs = endTimeMs - env.EXPIRY_NOTIFY_MINUTES * 60 * 1000;

    const outbox = await client.jobOutbox.findMany({
      where: { dedupeKey: { contains: reservation.id } },
      orderBy: { createdAt: "asc" },
    });
    const types = outbox.map(row => row.type).sort();
    expect(types).toEqual([
      JobTypes.EmailSend,
      JobTypes.ReservationExpireHold,
      JobTypes.ReservationNotifyNearExpiry,
    ].sort());

    const notifyJob = outbox.find(row => row.type === JobTypes.ReservationNotifyNearExpiry);
    const expireJob = outbox.find(row => row.type === JobTypes.ReservationExpireHold);
    const emailJob = outbox.find(row => row.type === JobTypes.EmailSend);

    expect(notifyJob?.runAt.getTime()).toBe(Math.max(now.getTime(), notifyAtMs));
    expect(expireJob?.runAt.getTime()).toBe(Math.max(now.getTime(), endTimeMs));
    expect(emailJob?.dedupeKey).toBe(`reservation-confirm:${reservation.id}`);
    expect(emailJob?.payload).toMatchObject({
      kind: "raw",
      to: email,
    });
  });

  it("confirmReservationUseCase activates reservation, rental, and bike", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });
    await createWallet(userId, 50000n);

    const now = new Date("2025-01-01T12:00:00.000Z");

    const reserveResult = await runReserve({
      userId,
      bikeId,
      stationId,
      startTime: now,
      now,
    });

    if (Either.isLeft(reserveResult)) {
      throw new Error(`Expected Right, got ${reserveResult.left._tag}`);
    }

    const reservationId = reserveResult.right.id;

    const confirmResult = await Effect.runPromise(
      provideDeps(
        confirmReservationUseCase({
          reservationId,
          userId,
          now,
        }).pipe(Effect.either),
      ),
    );

    if (Either.isLeft(confirmResult)) {
      throw new Error(`Expected Right, got ${confirmResult.left._tag}`);
    }

    const updatedReservation = await client.reservation.findUnique({ where: { id: reservationId } });
    expect(updatedReservation?.status).toBe("ACTIVE");

    const rental = await client.rental.findUnique({ where: { id: reservationId } });
    expect(rental?.status).toBe("RENTED");

    const bike = await client.bike.findUnique({ where: { id: bikeId } });
    expect(bike?.status).toBe("BOOKED");
  });

  it("cancelReservationUseCase cancels hold, releases bike, and refunds prepaid amount", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });
    const initialBalance = 50000n;
    await createWallet(userId, initialBalance);

    const now = new Date("2025-01-01T13:00:00.000Z");

    const reserveResult = await runReserve({
      userId,
      bikeId,
      stationId,
      startTime: now,
      now,
    });

    if (Either.isLeft(reserveResult)) {
      throw new Error(`Expected Right, got ${reserveResult.left._tag}`);
    }

    const reservationId = reserveResult.right.id;

    const cancelResult = await Effect.runPromise(
      provideDeps(
        cancelReservationUseCase({
          reservationId,
          userId,
          now,
        }).pipe(Effect.either),
      ),
    );

    if (Either.isLeft(cancelResult)) {
      throw new Error(`Expected Right, got ${cancelResult.left._tag}`);
    }

    const reservation = await client.reservation.findUnique({ where: { id: reservationId } });
    expect(reservation?.status).toBe("CANCELLED");

    const rental = await client.rental.findUnique({ where: { id: reservationId } });
    expect(rental?.status).toBe("CANCELLED");

    const bike = await client.bike.findUnique({ where: { id: bikeId } });
    expect(bike?.status).toBe("AVAILABLE");

    const wallet = await client.wallet.findUnique({ where: { userId } });
    expect(wallet?.balance).toBe(initialBalance);

    const refundTx = await client.walletTransaction.findFirst({
      where: { hash: `refund:reservation:${reservationId}` },
    });
    expect(refundTx).not.toBeNull();
  });

  it("reserveBikeUseCase fails when bike is already reserved", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId, status: "RESERVED" });
    await createWallet(userId, 50000n);

    const now = new Date("2025-01-01T10:00:00.000Z");
    const result = await runReserve({ userId, bikeId, stationId, startTime: now, now });
    expectLeftTag(result, "BikeNotAvailable");
  });
});
