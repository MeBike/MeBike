import { Effect, Layer } from "effect";

import {
  IncidentImageUploadServiceLive,
  IncidentRepositoryLive,
  IncidentServiceLive,
} from "@/domain/incidents";

import { FirebaseStorageLive, MapboxRoutingLive, PrismaLive } from "../infra.layers";
import { BikeReposLive } from "./bike.layers";
import { RentalReposLive } from "./rental.layers";
import { StationQueryReposLive } from "./station.layers";

export const IncidentReposLive = IncidentRepositoryLive.pipe(
  Layer.provide(PrismaLive),
  Layer.provide(MapboxRoutingLive),
);

export const IncidentServiceLayer = IncidentServiceLive.pipe(
  Layer.provide(IncidentReposLive),
  Layer.provide(RentalReposLive),
  Layer.provide(BikeReposLive),
  Layer.provide(StationQueryReposLive),
  Layer.provide(MapboxRoutingLive),
);

export const IncidentImageUploadServiceLayer = IncidentImageUploadServiceLive.pipe(
  Layer.provide(FirebaseStorageLive),
);

export const IncidentDepsLive = Layer.mergeAll(
  IncidentReposLive,
  IncidentServiceLayer,
  IncidentImageUploadServiceLayer,
  PrismaLive,
);

export function withIncidentDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(IncidentDepsLive));
}
