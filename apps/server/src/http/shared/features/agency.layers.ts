import { Effect, Layer } from "effect";

import {
  AgencyRepositoryLive,
  AgencyServiceLive,
} from "@/domain/agencies";

import { PrismaLive } from "../infra.layers";

export const AgencyReposLive = AgencyRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const AgencyServiceLayer = AgencyServiceLive.pipe(
  Layer.provide(AgencyReposLive),
);

export const AgencyDepsLive = Layer.mergeAll(
  AgencyReposLive,
  AgencyServiceLayer,
  PrismaLive,
);

export function withAgencyDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(AgencyDepsLive));
}
