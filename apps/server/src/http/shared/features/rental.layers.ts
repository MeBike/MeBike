import { Layer } from "effect";

import {
  RentalAnalyticsRepositoryLive,
  RentalCommandServiceLive,
  RentalRepositoryLive,
  RentalServiceLive,
  RentalStatsServiceLive,
  ReturnConfirmationRepositoryLive,
  ReturnSlotRepositoryLive,
} from "@/domain/rentals";

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

export const RentalCommandServiceLayer = RentalCommandServiceLive.pipe(
  Layer.provide(ReturnConfirmationReposLive),
  Layer.provide(ReturnSlotReposLive),
  Layer.provide(RentalReposLive),
  Layer.provide(BikeReposLive),
  Layer.provide(PrismaLive),
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
  RentalCommandServiceLayer,
  RentalStatsServiceLayer,
  BikeDepsLive,
  WalletDepsLive,
  SubscriptionReposLive,
  SubscriptionServiceLayer,
  PrismaLive,
);
