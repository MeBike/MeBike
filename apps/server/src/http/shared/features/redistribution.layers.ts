import { Layer } from "effect";

import {
  RedistributionRepositoryLive,
  RedistributionServiceLive,
} from "@/domain/redistribution";

import { PrismaLive } from "../infra.layers";
import { StationServiceLayer } from "./station.layers";
import { UserQueryServiceLayer } from "./user.layers";

export const RedistributionRequestReposLive = RedistributionRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const RedistributionRequestServiceLayer = RedistributionServiceLive.pipe(
  Layer.provide(RedistributionRequestReposLive),
  Layer.provide(UserQueryServiceLayer),
  Layer.provide(StationServiceLayer),
);

export const RedistributionRequestDepsLive = Layer.mergeAll(
  RedistributionRequestReposLive,
  RedistributionRequestServiceLayer,
  PrismaLive,
);
