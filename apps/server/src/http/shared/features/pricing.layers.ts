import { Layer } from "effect";

import {
  PricingPolicyCommandRepositoryLive,
  PricingPolicyCommandServiceLive,
  PricingPolicyQueryRepositoryLive,
  PricingPolicyQueryServiceLive,
} from "@/domain/pricing";

import { PrismaLive } from "../infra.layers";

export const PricingPolicyQueryReposLive = PricingPolicyQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const PricingPolicyCommandReposLive = PricingPolicyCommandRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const PricingPolicyQueryServiceLayer = PricingPolicyQueryServiceLive.pipe(
  Layer.provide(PricingPolicyQueryReposLive),
);

export const PricingPolicyCommandServiceLayer = PricingPolicyCommandServiceLive.pipe(
  Layer.provide(Layer.mergeAll(
    PricingPolicyCommandReposLive,
    PricingPolicyQueryReposLive,
    PrismaLive,
  )),
);

export const PricingDepsLive = Layer.mergeAll(
  PricingPolicyQueryReposLive,
  PricingPolicyCommandReposLive,
  PricingPolicyQueryServiceLayer,
  PricingPolicyCommandServiceLayer,
  PrismaLive,
);
