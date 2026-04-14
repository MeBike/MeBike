import { Layer } from "effect";

import {
  EnvironmentPolicyRepositoryLive,
  EnvironmentPolicyServiceLive,
} from "@/domain/environment";

import { PrismaLive } from "../infra.layers";

export const EnvironmentPolicyReposLive = EnvironmentPolicyRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const EnvironmentPolicyServiceLayer = EnvironmentPolicyServiceLive.pipe(
  Layer.provide(EnvironmentPolicyReposLive),
);

export const EnvironmentDepsLive = Layer.mergeAll(
  EnvironmentPolicyReposLive,
  EnvironmentPolicyServiceLayer,
  PrismaLive,
);
