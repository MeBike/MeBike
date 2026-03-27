import { Effect, Layer } from "effect";

import {
  StationRepositoryLive,
  StationServiceLive,
} from "@/domain/stations";

import { PrismaLive } from "../infra.layers";

export const StationReposLive = StationRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const StationServiceLayer = StationServiceLive.pipe(
  Layer.provide(StationReposLive),
);

export const StationDepsLive = Layer.mergeAll(
  StationReposLive,
  StationServiceLayer,
  PrismaLive,
);

export function withStationDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(StationDepsLive));
}
