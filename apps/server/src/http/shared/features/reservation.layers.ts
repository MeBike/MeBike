import { Effect, Layer } from "effect";

import {
  ReservationHoldServiceLive,
  ReservationRepositoryLive,
  ReservationServiceLive,
} from "@/domain/reservations";

import { PrismaLive } from "../infra.layers";
import { BikeReposLive } from "./bike.layers";
import { RentalReposLive } from "./rental.layers";
import { StationReposLive } from "./station.layers";
import {
  SubscriptionReposLive,
  SubscriptionServiceLayer,
} from "./subscription.layers";
import { UserReposLive } from "./user.layers";
import { WalletDepsLive } from "./wallet.layers";

export const ReservationReposLive = ReservationRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const ReservationServiceLayer = ReservationServiceLive.pipe(
  Layer.provide(ReservationReposLive),
);

export const ReservationHoldServiceLayer = ReservationHoldServiceLive.pipe(
  Layer.provide(ReservationReposLive),
);

export const ReservationDepsLive = Layer.mergeAll(
  ReservationReposLive,
  ReservationServiceLayer,
  ReservationHoldServiceLayer,
  BikeReposLive,
  StationReposLive,
  UserReposLive,
  RentalReposLive,
  WalletDepsLive,
  SubscriptionReposLive,
  SubscriptionServiceLayer,
  PrismaLive,
);

export function withReservationDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(ReservationDepsLive));
}
