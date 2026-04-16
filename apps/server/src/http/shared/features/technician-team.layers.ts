import { Layer } from "effect";

import {
  TechnicianTeamCommandRepositoryLive,
  TechnicianTeamCommandServiceLive,
  TechnicianTeamQueryRepositoryLive,
  TechnicianTeamQueryServiceLive,
} from "@/domain/technician-teams";

import { PrismaLive } from "../infra.layers";
import { StationQueryReposLive } from "./station.layers";

export const TechnicianTeamQueryReposLive = TechnicianTeamQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const TechnicianTeamCommandReposLive = TechnicianTeamCommandRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const TechnicianTeamQueryServiceLayer = TechnicianTeamQueryServiceLive.pipe(
  Layer.provide(TechnicianTeamQueryReposLive),
);

export const TechnicianTeamCommandServiceLayer = TechnicianTeamCommandServiceLive.pipe(
  Layer.provide(Layer.mergeAll(TechnicianTeamCommandReposLive, TechnicianTeamQueryReposLive, StationQueryReposLive)),
);

export const TechnicianTeamDepsLive = Layer.mergeAll(
  TechnicianTeamQueryReposLive,
  TechnicianTeamCommandReposLive,
  TechnicianTeamQueryServiceLayer,
  TechnicianTeamCommandServiceLayer,
  PrismaLive,
);
