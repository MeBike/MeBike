import { Layer } from "effect";

import {
  RedistributionRepositoryLive,
  RedistributionServiceLive,
} from "@/domain/redistribution";

import { PrismaLive } from "../infra.layers";

export const RedistributionRequestReposLive = RedistributionRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const RedistributionRequestServiceLayer = RedistributionServiceLive.pipe(
  Layer.provide(RedistributionRequestReposLive),
);

export const RedistributionRequestDepsLive = Layer.mergeAll(
  RedistributionRequestReposLive,
  RedistributionRequestServiceLayer,
  PrismaLive,
);
