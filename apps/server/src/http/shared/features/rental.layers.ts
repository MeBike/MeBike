import { Effect, Layer } from "effect";

import {
  RentalAnalyticsRepositoryLive,
  RentalRepositoryLive,
  RentalServiceLive,
  RentalStatsServiceLive,
  ReturnConfirmationRepositoryLive,
  ReturnSlotRepositoryLive,
} from "@/domain/rentals";
import { ReservationRepositoryLive } from "@/domain/reservations";

import { PrismaLive } from "../infra.layers";
import { BikeDepsLive, BikeReposLive } from "./bike.layers";
import { StationReposLive } from "./station.layers";
import {
  SubscriptionReposLive,
  SubscriptionServiceLayer,
} from "./subscription.layers";
import { WalletDepsLive } from "./wallet.layers";

export const RentalReposLive = RentalRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const ReturnSlotReposLive = ReturnSlotRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const ReturnConfirmationReposLive = ReturnConfirmationRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const RentalAnalyticsReposLive = RentalAnalyticsRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const RentalServiceLayer = RentalServiceLive.pipe(
  Layer.provide(RentalReposLive),
  Layer.provide(BikeReposLive),
  Layer.provide(StationReposLive),
);

export const RentalStatsServiceLayer = RentalStatsServiceLive.pipe(
  Layer.provide(RentalAnalyticsReposLive),
);

export const RentalDepsLive = Layer.mergeAll(
  RentalReposLive,
  ReturnSlotReposLive,
  ReturnConfirmationReposLive,
  RentalAnalyticsReposLive,
  RentalServiceLayer,
  RentalStatsServiceLayer,
  BikeDepsLive,
  WalletDepsLive,
  SubscriptionReposLive,
  SubscriptionServiceLayer,
  ReservationRepositoryLive,
  PrismaLive,
);

export function withRentalDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(RentalDepsLive));
}
