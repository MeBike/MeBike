import { Layer } from "effect";

import {
  EnvironmentImpactRepositoryLive,
  EnvironmentImpactServiceLive,
  EnvironmentPolicyRepositoryLive,
  EnvironmentPolicyServiceLive,
} from "@/domain/environment";

import { PrismaLive } from "../infra.layers";

export const EnvironmentPolicyReposLive = EnvironmentPolicyRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const EnvironmentImpactReposLive = EnvironmentImpactRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const EnvironmentPolicyServiceLayer = EnvironmentPolicyServiceLive.pipe(
  Layer.provide(EnvironmentPolicyReposLive),
);

export const EnvironmentImpactServiceLayer = EnvironmentImpactServiceLive.pipe(
  Layer.provide(EnvironmentImpactReposLive),
  Layer.provide(EnvironmentPolicyServiceLayer),
);

export const EnvironmentDepsLive = Layer.mergeAll(
  EnvironmentPolicyReposLive,
  EnvironmentImpactReposLive,
  EnvironmentPolicyServiceLayer,
  EnvironmentImpactServiceLayer,
  PrismaLive,
);
