import { Effect, Layer } from "effect";

import {
  RedistributionRepositoryLive,
  RedistributionServiceLive,
} from "@/domain/redistribution";

import { PrismaLive } from "../infra.layers";
import { StationQueryServiceLayer } from "./station.layers";
import { UserQueryServiceLayer } from "./user.layers";

export const RedistributionRequestReposLive = RedistributionRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const RedistributionRequestServiceLayer = RedistributionServiceLive.pipe(
  Layer.provide(RedistributionRequestReposLive),
  Layer.provide(UserQueryServiceLayer),
  Layer.provide(StationQueryServiceLayer),
  Layer.provide(PrismaLive),
);

export const RedistributionRequestDepsLive = Layer.mergeAll(
  RedistributionRequestReposLive,
  RedistributionRequestServiceLayer,
  PrismaLive,
);

export function withRedistributionRequestDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(RedistributionRequestDepsLive));
}
