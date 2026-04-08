import { Layer } from "effect";

import {
  AgencyStatsRepositoryLive,
  AgencyStatsServiceLive,
  AgencyRepositoryLive,
  AgencyServiceLive,
} from "@/domain/agencies";

import { PrismaLive } from "../infra.layers";

export const AgencyReposLive = AgencyRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const AgencyStatsReposLive = AgencyStatsRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const AgencyServiceLayer = AgencyServiceLive.pipe(
  Layer.provide(AgencyReposLive),
);

export const AgencyStatsServiceLayer = AgencyStatsServiceLive.pipe(
  Layer.provide(Layer.mergeAll(AgencyReposLive, AgencyStatsReposLive)),
);

export const AgencyDepsLive = Layer.mergeAll(
  AgencyReposLive,
  AgencyStatsReposLive,
  AgencyServiceLayer,
  AgencyStatsServiceLayer,
  PrismaLive,
);
