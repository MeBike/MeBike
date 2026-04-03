import { Layer } from "effect";

import { TechnicianTeamQueryRepositoryLive } from "@/domain/technician-teams";

import { PrismaLive } from "../infra.layers";

export const TechnicianTeamQueryReposLive = TechnicianTeamQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const TechnicianTeamDepsLive = Layer.mergeAll(
  TechnicianTeamQueryReposLive,
  PrismaLive,
);
