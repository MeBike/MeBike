import { Layer } from "effect";

import type {
  ReservationHoldServiceTag,
  ReservationServiceTag,
} from "@/domain/reservations";
import type { SubscriptionServiceTag } from "@/domain/subscriptions/services/subscription.service";
import type { WalletServiceTag } from "@/domain/wallets/services/wallet.service";
import type { PrismaClient } from "generated/prisma/client";

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
import { runEffectEitherWithLayer } from "@/test/effect/run";

export type ReservationDeps
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

export function makeReservationUseCaseTestLayer(client: PrismaClient) {
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

  return Layer.mergeAll(
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
}

export function makeReservationUseCaseRunners(layer: Layer.Layer<ReservationDeps>) {
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
        reserveBikeUseCase({
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
        confirmReservationUseCase(args),
        layer,
      );
    },
    cancel(args: { reservationId: string; userId: string; now: Date }) {
      return runEffectEitherWithLayer(
        cancelReservationUseCase(args),
        layer,
      );
    },
  };
}
