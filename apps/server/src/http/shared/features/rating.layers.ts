import { Effect, Layer } from "effect";

import {
  RatingReasonRepositoryLive,
  RatingRepositoryLive,
  RatingServiceLive,
} from "@/domain/ratings";

import { PrismaLive } from "../infra.layers";
import { BikeReposLive } from "./bike.layers";
import { RentalReposLive, RentalServiceLayer } from "./rental.layers";
import { StationReposLive } from "./station.layers";

export const RatingReposLive = Layer.mergeAll(
  RatingRepositoryLive,
  RatingReasonRepositoryLive,
).pipe(
  Layer.provide(PrismaLive),
);

export const RatingServiceLayer = RatingServiceLive.pipe(
  Layer.provide(RatingReposLive),
  Layer.provide(BikeReposLive),
  Layer.provide(StationReposLive),
);

export const RatingDepsLive = Layer.mergeAll(
  RatingReposLive,
  RatingServiceLayer,
  RentalReposLive,
  RentalServiceLayer,
  PrismaLive,
);

export function withRatingDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(
    Effect.provide(RatingDepsLive),
    Effect.provide(PrismaLive),
  );
}
