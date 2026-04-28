import { Layer } from "effect";

import {
  RentalAnalyticsRepositoryLive,
  RentalBillingDetailServiceLive,
  RentalBillingPreviewServiceLive,
  RentalCommandServiceLive,
  RentalRepositoryLive,
  RentalServiceLive,
  RentalStatsServiceLive,
  ReturnSlotRepositoryLive,
} from "@/domain/rentals";

import { PrismaLive } from "../infra.layers";
import { BikeDepsLive, BikeReposLive } from "./bike.layers";
import { CouponServiceLayer } from "./coupon.layers";
import { StationQueryReposLive } from "./station.layers";
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

export const RentalAnalyticsReposLive = RentalAnalyticsRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const RentalServiceLayer = RentalServiceLive.pipe(
  Layer.provide(RentalReposLive),
  Layer.provide(BikeReposLive),
  Layer.provide(StationQueryReposLive),
);

export const RentalCommandServiceLayer = RentalCommandServiceLive.pipe(
  Layer.provide(ReturnSlotReposLive),
  Layer.provide(RentalReposLive),
  Layer.provide(BikeReposLive),
  Layer.provide(PrismaLive),
);

export const RentalStatsServiceLayer = RentalStatsServiceLive.pipe(
  Layer.provide(RentalAnalyticsReposLive),
);

export const RentalBillingPreviewServiceLayer = RentalBillingPreviewServiceLive.pipe(
  Layer.provide(CouponServiceLayer),
  Layer.provide(PrismaLive),
);

export const RentalBillingDetailServiceLayer = RentalBillingDetailServiceLive.pipe(
  Layer.provide(RentalReposLive),
);

export const RentalDepsLive = Layer.mergeAll(
  RentalReposLive,
  ReturnSlotReposLive,
  RentalAnalyticsReposLive,
  RentalServiceLayer,
  RentalCommandServiceLayer,
  RentalStatsServiceLayer,
  RentalBillingDetailServiceLayer,
  RentalBillingPreviewServiceLayer,
  BikeDepsLive,
  WalletDepsLive,
  SubscriptionReposLive,
  SubscriptionServiceLayer,
  PrismaLive,
);
