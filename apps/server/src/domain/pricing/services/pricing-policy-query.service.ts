import { Effect, Layer } from "effect";

import type { PricingPolicyReadRepo } from "../repository/pricing-policy.repository.types";
import type { PricingPolicyQueryService } from "./pricing-policy.service.types";

import { PricingPolicyQueryRepository } from "../repository/pricing-policy-query.repository";

export function makePricingPolicyQueryService(
  repo: PricingPolicyReadRepo,
): PricingPolicyQueryService {
  return {
    getById: pricingPolicyId => repo.getById(pricingPolicyId),
    getActive: () => repo.getActive(),
    listPolicies: status => repo.listByStatus(status),
    getUsageSummary: pricingPolicyId => repo.getUsageSummary(pricingPolicyId),
  };
}

export type { PricingPolicyQueryService } from "./pricing-policy.service.types";

const makePricingPolicyQueryServiceEffect = Effect.gen(function* () {
  const repo = yield* PricingPolicyQueryRepository;
  return makePricingPolicyQueryService(repo);
});

export class PricingPolicyQueryServiceTag extends Effect.Service<PricingPolicyQueryServiceTag>()(
  "PricingPolicyQueryService",
  {
    effect: makePricingPolicyQueryServiceEffect,
  },
) {}

export const PricingPolicyQueryServiceLive = Layer.effect(
  PricingPolicyQueryServiceTag,
  makePricingPolicyQueryServiceEffect.pipe(Effect.map(PricingPolicyQueryServiceTag.make)),
);
