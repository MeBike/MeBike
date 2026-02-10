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
import { Prisma } from "@/infrastructure/prisma";
import { getTestDatabase } from "@/test/db/test-database";
import { PrismaClient } from "generated/prisma/client";

type TestContainer = { stop: () => Promise<void>; url: string };

describe("reservation use-cases unhappy paths", () => {
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
    await client.user.create({
      data: {
        id,
        fullname: "Reservation User",
        email: `reservation-${id}@example.com`,
        passwordHash: "hash",
        role: "USER",
        verify: "VERIFIED",
      },
    });
    return { id };
  };

  const createStation = async () => {
    const id = uuidv7();
    const address = "123 Test St";
    const capacity = 10;
    const latitude = 10.762622;
    const longitude = 106.660172;
    const updatedAt = new Date();
    const name = `Station ${id}`;

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
        ${name},
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

  const createSubscription = async (args: {
    userId: string;
    status?: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
    maxUsages?: number | null;
    usageCount?: number;
  }) => {
    const id = uuidv7();
    await client.subscription.create({
      data: {
        id,
        userId: args.userId,
        packageName: "basic",
        maxUsages: args.maxUsages ?? null,
        usageCount: args.usageCount ?? 0,
        status: args.status ?? "ACTIVE",
        activatedAt: args.status === "ACTIVE" ? new Date() : null,
        expiresAt: args.status === "ACTIVE" ? new Date(Date.now() + 86400000) : null,
        price: 10000n,
      },
    });
    return { id };
  };

  const runReserve = (args: {
    userId: string;
    bikeId: string;
    stationId: string;
    startTime: Date;
    now: Date;
    reservationOption?: "ONE_TIME" | "SUBSCRIPTION";
    subscriptionId?: string | null;
  }) =>
    Effect.runPromise(
      provideDeps(
        reserveBikeUseCase({
          userId: args.userId,
          bikeId: args.bikeId,
          stationId: args.stationId,
          startTime: args.startTime,
          reservationOption: args.reservationOption ?? "ONE_TIME",
          subscriptionId: args.subscriptionId,
          now: args.now,
        }).pipe(Effect.either),
      ),
    );

  const runConfirm = (args: { reservationId: string; userId: string; now: Date }) =>
    Effect.runPromise(
      provideDeps(
        confirmReservationUseCase({
          reservationId: args.reservationId,
          userId: args.userId,
          now: args.now,
        }).pipe(Effect.either),
      ),
    );

  const runCancel = (args: { reservationId: string; userId: string; now: Date }) =>
    Effect.runPromise(
      provideDeps(
        cancelReservationUseCase({
          reservationId: args.reservationId,
          userId: args.userId,
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

  it("reserveBikeUseCase fails with ActiveReservationExists when user already has active reservation", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });
    await createWallet(userId, 50000n);

    await client.reservation.create({
      data: {
        id: uuidv7(),
        userId,
        bikeId: null,
        stationId,
        reservationOption: "ONE_TIME",
        status: "ACTIVE",
        startTime: new Date(),
        endTime: null,
        prepaid: "0",
      },
    });

    const now = new Date();
    const result = await runReserve({ userId, bikeId, stationId, startTime: now, now });
    expectLeftTag(result, "ActiveReservationExists");
  });

  it("reserveBikeUseCase fails with BikeAlreadyReserved when bike is held", async () => {
    const { id: userId } = await createUser();
    const { id: otherUserId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });
    await createWallet(userId, 50000n);
    await createWallet(otherUserId, 50000n);

    const now = new Date();
    await client.reservation.create({
      data: {
        id: uuidv7(),
        userId: otherUserId,
        bikeId,
        stationId,
        reservationOption: "ONE_TIME",
        status: "PENDING",
        startTime: new Date(now.getTime() - 1000),
        endTime: new Date(now.getTime() + 1000 * 60 * 10),
        prepaid: "0",
      },
    });

    const result = await runReserve({ userId, bikeId, stationId, startTime: now, now });
    expectLeftTag(result, "BikeAlreadyReserved");
  });

  it("reserveBikeUseCase fails with WalletNotFound when user has no wallet", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });

    const now = new Date();
    const result = await runReserve({ userId, bikeId, stationId, startTime: now, now });
    expectLeftTag(result, "WalletNotFound");
  });

  it("reserveBikeUseCase fails with InsufficientWalletBalance when balance too low", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });
    await createWallet(userId, 0n);

    const now = new Date();
    const result = await runReserve({ userId, bikeId, stationId, startTime: now, now });
    expectLeftTag(result, "InsufficientWalletBalance");
  });

  it("reserveBikeUseCase fails with SubscriptionRequired when subscription option missing id", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });
    await createWallet(userId, 50000n);

    const now = new Date();
    const result = await runReserve({
      userId,
      bikeId,
      stationId,
      startTime: now,
      now,
      reservationOption: "SUBSCRIPTION",
    });
    expectLeftTag(result, "SubscriptionRequired");
  });

  it("reserveBikeUseCase fails with SubscriptionNotUsable for mismatched user", async () => {
    const { id: userId } = await createUser();
    const { id: otherUserId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });
    await createWallet(userId, 50000n);
    const subscription = await createSubscription({ userId: otherUserId, status: "ACTIVE" });

    const now = new Date();
    const result = await runReserve({
      userId,
      bikeId,
      stationId,
      startTime: now,
      now,
      reservationOption: "SUBSCRIPTION",
      subscriptionId: subscription.id,
    });
    expectLeftTag(result, "SubscriptionNotUsable");
  });

  it("reserveBikeUseCase fails with SubscriptionUsageExceeded when max usage reached", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });
    await createWallet(userId, 50000n);
    const subscription = await createSubscription({
      userId,
      status: "ACTIVE",
      maxUsages: 1,
      usageCount: 1,
    });

    const now = new Date();
    const result = await runReserve({
      userId,
      bikeId,
      stationId,
      startTime: now,
      now,
      reservationOption: "SUBSCRIPTION",
      subscriptionId: subscription.id,
    });
    expectLeftTag(result, "SubscriptionUsageExceeded");
  });

  it("confirmReservationUseCase fails with ReservationNotFound", async () => {
    const { id: userId } = await createUser();
    const now = new Date();

    const result = await runConfirm({
      reservationId: uuidv7(),
      userId,
      now,
    });
    expectLeftTag(result, "ReservationNotFound");
  });

  it("confirmReservationUseCase fails with ReservationNotOwned", async () => {
    const { id: userId } = await createUser();
    const { id: otherUserId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });

    const reservationId = uuidv7();
    await client.reservation.create({
      data: {
        id: reservationId,
        userId: otherUserId,
        bikeId,
        stationId,
        reservationOption: "ONE_TIME",
        status: "PENDING",
        startTime: new Date(),
        endTime: new Date(Date.now() + env.RESERVATION_HOLD_MINUTES * 60 * 1000),
        prepaid: "0",
      },
    });

    const result = await runConfirm({ reservationId, userId, now: new Date() });
    expectLeftTag(result, "ReservationNotOwned");
  });

  it("confirmReservationUseCase fails with ReservationMissingBike", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const reservationId = uuidv7();
    await client.reservation.create({
      data: {
        id: reservationId,
        userId,
        bikeId: null,
        stationId,
        reservationOption: "ONE_TIME",
        status: "PENDING",
        startTime: new Date(),
        endTime: new Date(Date.now() + env.RESERVATION_HOLD_MINUTES * 60 * 1000),
        prepaid: "0",
      },
    });

    const result = await runConfirm({ reservationId, userId, now: new Date() });
    expectLeftTag(result, "ReservationMissingBike");
  });

  it("confirmReservationUseCase fails with InvalidReservationTransition", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const { id: bikeId } = await createBike({ stationId });
    const reservationId = uuidv7();
    await client.reservation.create({
      data: {
        id: reservationId,
        userId,
        bikeId,
        stationId,
        reservationOption: "ONE_TIME",
        status: "ACTIVE",
        startTime: new Date(),
        endTime: null,
        prepaid: "0",
      },
    });

    const result = await runConfirm({ reservationId, userId, now: new Date() });
    expectLeftTag(result, "InvalidReservationTransition");
  });

  it("cancelReservationUseCase fails with ReservationNotOwned", async () => {
    const { id: userId } = await createUser();
    const { id: otherUserId } = await createUser();
    const { id: stationId } = await createStation();
    const reservationId = uuidv7();
    await client.reservation.create({
      data: {
        id: reservationId,
        userId: otherUserId,
        bikeId: null,
        stationId,
        reservationOption: "ONE_TIME",
        status: "PENDING",
        startTime: new Date(),
        endTime: null,
        prepaid: "0",
      },
    });

    const result = await runCancel({ reservationId, userId, now: new Date() });
    expectLeftTag(result, "ReservationNotOwned");
  });

  it("cancelReservationUseCase fails with InvalidReservationTransition", async () => {
    const { id: userId } = await createUser();
    const { id: stationId } = await createStation();
    const reservationId = uuidv7();
    await client.reservation.create({
      data: {
        id: reservationId,
        userId,
        bikeId: null,
        stationId,
        reservationOption: "ONE_TIME",
        status: "ACTIVE",
        startTime: new Date(),
        endTime: null,
        prepaid: "0",
      },
    });

    const result = await runCancel({ reservationId, userId, now: new Date() });
    expectLeftTag(result, "InvalidReservationTransition");
  });
});
