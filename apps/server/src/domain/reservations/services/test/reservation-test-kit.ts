import { Layer } from "effect";

import type {
  ReservationQueryServiceTag,
} from "@/domain/reservations";
import type {
  SubscriptionCommandServiceTag,
  SubscriptionQueryServiceTag,
} from "@/domain/subscriptions";
import type { WalletServiceTag } from "@/domain/wallets/services/wallet.service";
import type { PrismaClient } from "generated/prisma/client";

import { BikeRepository, makeBikeRepository } from "@/domain/bikes";
import { makeRentalRepository, RentalRepository } from "@/domain/rentals";
import {
  cancelReservation,
  confirmReservation,
  makeReservationCommandRepository,
  makeReservationQueryRepository,
  ReservationCommandRepository,
  ReservationQueryRepository,
  ReservationQueryServiceLive,
  reserveBike,
} from "@/domain/reservations";
import { makeStationQueryRepository, StationQueryRepository } from "@/domain/stations";
import {
  makeSubscriptionCommandRepository,
  makeSubscriptionQueryRepository,
  SubscriptionCommandRepository,
  SubscriptionCommandServiceLive,
  SubscriptionQueryRepository,
  SubscriptionQueryServiceLive,
} from "@/domain/subscriptions";
import { makeWalletRepository, WalletRepository } from "@/domain/wallets";
import { WalletServiceLive } from "@/domain/wallets/services/wallet.service";
import { Prisma } from "@/infrastructure/prisma";
import { runEffectEitherWithLayer } from "@/test/effect/run";

const DEFAULT_TEST_NOW = new Date("2025-01-01T10:00:00.000Z");

export type ReservationDeps
  = | Prisma
    | ReservationQueryRepository
    | ReservationCommandRepository
    | ReservationQueryServiceTag
    | BikeRepository
    | StationQueryRepository
    | WalletRepository
    | WalletServiceTag
    | SubscriptionQueryRepository
    | SubscriptionCommandRepository
    | SubscriptionQueryServiceTag
    | SubscriptionCommandServiceTag
    | RentalRepository;

export function makeReservationTestLayer(client: PrismaClient) {
  const reservationQueryRepo = makeReservationQueryRepository(client);
  const reservationCommandRepo = makeReservationCommandRepository(client);
  const bikeRepo = makeBikeRepository(client);
  const stationRepo = makeStationQueryRepository(client);
  const walletRepo = makeWalletRepository(client);
  const subscriptionQueryRepo = makeSubscriptionQueryRepository(client);
  const subscriptionCommandRepo = makeSubscriptionCommandRepository(client);
  const rentalRepo = makeRentalRepository(client);

  const prismaLayer = Layer.succeed(Prisma, Prisma.make({ client }));
  const reservationQueryRepoLayer = Layer.succeed(
    ReservationQueryRepository,
    ReservationQueryRepository.make(reservationQueryRepo),
  );
  const reservationCommandRepoLayer = Layer.succeed(
    ReservationCommandRepository,
    ReservationCommandRepository.make(reservationCommandRepo),
  );
  const reservationQueryServiceLayer = ReservationQueryServiceLive.pipe(
    Layer.provide(reservationQueryRepoLayer),
  );
  const walletRepoLayer = Layer.succeed(WalletRepository, walletRepo);
  const walletServiceLayer = WalletServiceLive.pipe(
    Layer.provide(walletRepoLayer),
  );
  const subscriptionQueryRepoLayer = Layer.succeed(
    SubscriptionQueryRepository,
    SubscriptionQueryRepository.make(subscriptionQueryRepo),
  );
  const subscriptionCommandRepoLayer = Layer.succeed(
    SubscriptionCommandRepository,
    SubscriptionCommandRepository.make(subscriptionCommandRepo),
  );
  const subscriptionQueryServiceLayer = SubscriptionQueryServiceLive.pipe(
    Layer.provide(subscriptionQueryRepoLayer),
  );
  const subscriptionCommandServiceLayer = SubscriptionCommandServiceLive.pipe(
    Layer.provide(Layer.mergeAll(subscriptionQueryRepoLayer, subscriptionCommandRepoLayer)),
  );

  return Layer.mergeAll(
    prismaLayer,
    reservationQueryRepoLayer,
    reservationCommandRepoLayer,
    reservationQueryServiceLayer,
    Layer.succeed(BikeRepository, BikeRepository.make(bikeRepo)),
    Layer.succeed(StationQueryRepository, StationQueryRepository.make(stationRepo)),
    walletRepoLayer,
    walletServiceLayer,
    subscriptionQueryRepoLayer,
    subscriptionCommandRepoLayer,
    subscriptionQueryServiceLayer,
    subscriptionCommandServiceLayer,
    Layer.succeed(RentalRepository, RentalRepository.make(rentalRepo)),
  );
}

export function makeReservationRunners(layer: Layer.Layer<ReservationDeps>) {
  return {
    reserve(args: {
      userId: string;
      bikeId: string;
      stationId: string;
      startTime: Date;
      now: Date;
      reservationOption?: "ONE_TIME" | "SUBSCRIPTION" | "FIXED_SLOT";
      subscriptionId?: string | null;
    }) {
      return runEffectEitherWithLayer(
        reserveBike({
          userId: args.userId,
          bikeId: args.bikeId,
          stationId: args.stationId,
          startTime: args.startTime,
          reservationOption: args.reservationOption ?? "ONE_TIME",
          subscriptionId: args.subscriptionId,
          now: args.now,
        }),
        layer,
      );
    },
    confirm(args: { reservationId: string; userId: string; now: Date }) {
      return runEffectEitherWithLayer(
        confirmReservation({
          ...args,
          now: args.now ?? DEFAULT_TEST_NOW,
        }),
        layer,
      );
    },
    cancel(args: { reservationId: string; userId: string; now: Date }) {
      return runEffectEitherWithLayer(
        cancelReservation(args),
        layer,
      );
    },
  };
}
