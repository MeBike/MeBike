import { Layer } from "effect";

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
