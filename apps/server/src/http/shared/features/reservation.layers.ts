import { Layer } from "effect";

import {
  FixedSlotTemplateServiceLive,
  ReservationAnalyticsRepositoryLive,
  ReservationCommandRepositoryLive,
  ReservationQueryRepositoryLive,
  ReservationQueryServiceLive,
  ReservationStatsServiceLive,
} from "@/domain/reservations";

import { PrismaLive } from "../infra.layers";
import { BikeReposLive } from "./bike.layers";
import { RentalReposLive } from "./rental.layers";
import { StationQueryReposLive } from "./station.layers";
import {
  SubscriptionReposLive,
  SubscriptionServiceLayer,
} from "./subscription.layers";
import { WalletDepsLive } from "./wallet.layers";

export const ReservationQueryReposLive = ReservationQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const ReservationCommandReposLive = ReservationCommandRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const ReservationAnalyticsReposLive = ReservationAnalyticsRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const ReservationQueryServiceLayer = ReservationQueryServiceLive.pipe(
  Layer.provide(ReservationQueryReposLive),
);

export const ReservationStatsServiceLayer = ReservationStatsServiceLive.pipe(
  Layer.provide(ReservationAnalyticsReposLive),
);

export const FixedSlotTemplateServiceLayer = FixedSlotTemplateServiceLive.pipe(
  Layer.provide(Layer.mergeAll(
    ReservationQueryReposLive,
    ReservationCommandReposLive,
    StationQueryReposLive,
  )),
);

export const ReservationDepsLive = Layer.mergeAll(
  ReservationQueryReposLive,
  ReservationCommandReposLive,
  ReservationAnalyticsReposLive,
  ReservationQueryServiceLayer,
  ReservationStatsServiceLayer,
  FixedSlotTemplateServiceLayer,
  BikeReposLive,
  StationQueryReposLive,
  RentalReposLive,
  WalletDepsLive,
  SubscriptionReposLive,
  SubscriptionServiceLayer,
  PrismaLive,
);
