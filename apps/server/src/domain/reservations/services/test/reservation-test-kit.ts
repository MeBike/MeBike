import { Layer } from "effect";

import type {
  ReservationCommandServiceTag,
  ReservationQueryServiceTag,
} from "@/domain/reservations";
import type { SubscriptionServiceTag } from "@/domain/subscriptions/services/subscription.service";
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
  ReservationCommandServiceLive,
  ReservationQueryRepository,
  ReservationQueryServiceLive,
  reserveBike,
} from "@/domain/reservations";
import { makeStationRepository, StationRepository } from "@/domain/stations";
import { SubscriptionRepository } from "@/domain/subscriptions";
import { makeSubscriptionRepository } from "@/domain/subscriptions/repository/subscription.repository";
import { SubscriptionServiceLive } from "@/domain/subscriptions/services/subscription.service";
import { makeWalletRepository, WalletRepository } from "@/domain/wallets";
import { WalletServiceLive } from "@/domain/wallets/services/wallet.service";
import { Prisma } from "@/infrastructure/prisma";
import { runEffectEitherWithLayer } from "@/test/effect/run";

export type ReservationDeps
  = | Prisma
    | ReservationQueryRepository
    | ReservationCommandRepository
    | ReservationQueryServiceTag
    | ReservationCommandServiceTag
    | BikeRepository
    | StationRepository
    | WalletRepository
    | WalletServiceTag
    | SubscriptionRepository
    | SubscriptionServiceTag
    | RentalRepository;

export function makeReservationTestLayer(client: PrismaClient) {
  const reservationQueryRepo = makeReservationQueryRepository(client);
  const reservationCommandRepo = makeReservationCommandRepository(client);
  const bikeRepo = makeBikeRepository(client);
  const stationRepo = makeStationRepository(client);
  const walletRepo = makeWalletRepository(client);
  const subscriptionRepo = makeSubscriptionRepository(client);
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
  const reservationCommandServiceLayer = ReservationCommandServiceLive.pipe(
    Layer.provide(reservationCommandRepoLayer),
  );
  const walletRepoLayer = Layer.succeed(WalletRepository, walletRepo);
  const walletServiceLayer = WalletServiceLive.pipe(
    Layer.provide(walletRepoLayer),
  );
  const subscriptionRepoLayer = Layer.succeed(SubscriptionRepository, subscriptionRepo);
  const subscriptionServiceLayer = SubscriptionServiceLive.pipe(
    Layer.provide(subscriptionRepoLayer),
  );

  return Layer.mergeAll(
    prismaLayer,
    reservationQueryRepoLayer,
    reservationCommandRepoLayer,
    reservationQueryServiceLayer,
    reservationCommandServiceLayer,
    Layer.succeed(BikeRepository, BikeRepository.make(bikeRepo)),
    Layer.succeed(StationRepository, StationRepository.make(stationRepo)),
    walletRepoLayer,
    walletServiceLayer,
    subscriptionRepoLayer,
    subscriptionServiceLayer,
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
        confirmReservation(args),
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
