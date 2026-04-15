import { Layer } from "effect";

import {
  StationCommandRepositoryLive,
  StationCommandServiceLive,
  StationQueryRepositoryLive,
  StationQueryServiceLive,
} from "@/domain/stations";

import { PrismaLive } from "../infra.layers";
import { AgencyReposLive } from "./agency.layers";

export const StationQueryReposLive = StationQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const StationCommandReposLive = StationCommandRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const StationQueryServiceLayer = StationQueryServiceLive.pipe(
  Layer.provide(StationQueryReposLive),
);

export const StationCommandServiceLayer = StationCommandServiceLive.pipe(
  Layer.provide(Layer.mergeAll(StationCommandReposLive, StationQueryReposLive, AgencyReposLive)),
);

export const StationDepsLive = Layer.mergeAll(
  StationQueryReposLive,
  StationCommandReposLive,
  StationQueryServiceLayer,
  StationCommandServiceLayer,
  PrismaLive,
);
