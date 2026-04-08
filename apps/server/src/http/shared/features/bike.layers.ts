import { Layer } from "effect";

import {
  BikeRepositoryLive,
  BikeServiceLive,
  BikeStatsRepositoryLive,
  BikeStatsServiceLive,
} from "@/domain/bikes";

import { PrismaLive } from "../infra.layers";

export const BikeReposLive = BikeRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const BikeServiceLayer = BikeServiceLive.pipe(
  Layer.provide(BikeReposLive),
  Layer.provide(PrismaLive),
);

export const BikeStatsServiceLayer = BikeStatsServiceLive.pipe(
  Layer.provide(BikeStatsRepositoryLive),
  Layer.provide(BikeReposLive),
);

export const BikeDepsLive = Layer.mergeAll(
  BikeReposLive,
  BikeStatsRepositoryLive,
  BikeServiceLayer,
  BikeStatsServiceLayer,
  PrismaLive,
);
