import { Layer } from "effect";

import {
  AgencyRequestRepositoryLive,
  AgencyRequestServiceLive,
} from "@/domain/agency-requests";

import { PrismaLive } from "../infra.layers";

export const AgencyRequestReposLive = AgencyRequestRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const AgencyRequestServiceLayer = AgencyRequestServiceLive.pipe(
  Layer.provide(AgencyRequestReposLive),
);

export const AgencyRequestDepsLive = Layer.mergeAll(
  AgencyRequestReposLive,
  AgencyRequestServiceLayer,
  PrismaLive,
);
