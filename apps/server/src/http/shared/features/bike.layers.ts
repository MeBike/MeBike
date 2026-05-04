import { Layer } from "effect";

import {
  BikeCommandServiceLive,
  BikeQueryServiceLive,
  BikeRepositoryLive,
  BikeStatsRepositoryLive,
  BikeStatsServiceLive,
} from "@/domain/bikes";

import { PrismaLive } from "../infra.layers";

export const BikeReposLive = BikeRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const BikeCommandServiceLayer = BikeCommandServiceLive.pipe(
  Layer.provide(BikeReposLive),
  Layer.provide(PrismaLive),
);

export const BikeQueryServiceLayer = BikeQueryServiceLive.pipe(
  Layer.provide(BikeReposLive),
);

export const BikeStatsServiceLayer = BikeStatsServiceLive.pipe(
  Layer.provide(BikeStatsRepositoryLive),
  Layer.provide(BikeReposLive),
);

export const BikeDepsLive = Layer.mergeAll(
  BikeReposLive,
  BikeStatsRepositoryLive,
  BikeCommandServiceLayer,
  BikeQueryServiceLayer,
  BikeStatsServiceLayer,
  PrismaLive,
);
