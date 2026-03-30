import { Effect, Layer } from "effect";

import {
  IncidentRepositoryLive,
  IncidentServiceLive,
} from "@/domain/incidents";

import { PrismaLive } from "../infra.layers";
import { BikeReposLive } from "./bike.layers";
import { RentalReposLive } from "./rental.layers";
import { StationReposLive } from "./station.layers";

export const IncidentReposLive = IncidentRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const IncidentServiceLayer = IncidentServiceLive.pipe(
  Layer.provide(IncidentReposLive),
  Layer.provide(RentalReposLive),
  Layer.provide(BikeReposLive),
  Layer.provide(StationReposLive),
);

export const IncidentDepsLive = Layer.mergeAll(
  IncidentReposLive,
  IncidentServiceLayer,
  PrismaLive,
);

export function withIncidentDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(IncidentDepsLive));
}
