import { Layer } from "effect";

import {
  StationAnalyticsRepositoryLive,
  StationCommandRepositoryLive,
  StationCommandServiceLive,
  StationQueryRepositoryLive,
  StationQueryServiceLive,
  StationStatsServiceLive,
} from "@/domain/stations";

import { PrismaLive } from "../infra.layers";
import { AgencyReposLive } from "./agency.layers";

export const StationQueryReposLive = StationQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const StationCommandReposLive = StationCommandRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const StationAnalyticsReposLive = StationAnalyticsRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const StationQueryServiceLayer = StationQueryServiceLive.pipe(
  Layer.provide(StationQueryReposLive),
);

export const StationCommandServiceLayer = StationCommandServiceLive.pipe(
  Layer.provide(Layer.mergeAll(StationCommandReposLive, StationQueryReposLive, AgencyReposLive)),
);

export const StationStatsServiceLayer = StationStatsServiceLive.pipe(
  Layer.provide(Layer.mergeAll(StationAnalyticsReposLive, StationQueryReposLive)),
);

export const StationDepsLive = Layer.mergeAll(
  StationAnalyticsReposLive,
  StationQueryReposLive,
  StationCommandReposLive,
  StationQueryServiceLayer,
  StationCommandServiceLayer,
  StationStatsServiceLayer,
  PrismaLive,
);
