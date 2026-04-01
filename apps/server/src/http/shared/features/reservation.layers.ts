import { Layer } from "effect";

import {
  ReservationCommandRepositoryLive,
  ReservationCommandServiceLive,
  ReservationQueryRepositoryLive,
  ReservationQueryServiceLive,
} from "@/domain/reservations";

import { PrismaLive } from "../infra.layers";
import { BikeReposLive } from "./bike.layers";
import { RentalReposLive } from "./rental.layers";
import { StationReposLive } from "./station.layers";
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

export const ReservationQueryServiceLayer = ReservationQueryServiceLive.pipe(
  Layer.provide(ReservationQueryReposLive),
);

export const ReservationCommandServiceLayer = ReservationCommandServiceLive.pipe(
  Layer.provide(ReservationCommandReposLive),
);

export const ReservationDepsLive = Layer.mergeAll(
  ReservationQueryReposLive,
  ReservationCommandReposLive,
  ReservationQueryServiceLayer,
  ReservationCommandServiceLayer,
  BikeReposLive,
  StationReposLive,
  RentalReposLive,
  WalletDepsLive,
  SubscriptionReposLive,
  SubscriptionServiceLayer,
  PrismaLive,
);
