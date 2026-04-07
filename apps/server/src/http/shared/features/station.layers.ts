import { Layer } from "effect";

import { AgencyReposLive } from "./agency.layers";

import {
  StationRepositoryLive,
  StationServiceLive,
} from "@/domain/stations";

import { PrismaLive } from "../infra.layers";

export const StationReposLive = StationRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const StationServiceLayer = StationServiceLive.pipe(
  Layer.provide(Layer.mergeAll(StationReposLive, AgencyReposLive)),
);

export const StationDepsLive = Layer.mergeAll(
  StationReposLive,
  StationServiceLayer,
  PrismaLive,
);
