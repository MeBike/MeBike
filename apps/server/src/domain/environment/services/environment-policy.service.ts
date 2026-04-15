import { Context, Effect, Layer } from "effect";

import type {
  EnvironmentPolicyActivationBlocked,
  EnvironmentPolicyNotFound,
} from "../domain-errors";
import type {
  CreateEnvironmentPolicyInput,
  EnvironmentPolicyPageResult,
  EnvironmentPolicyRow,
  ListEnvironmentPoliciesInput,
} from "../models";

import { ActiveEnvironmentPolicyNotFound } from "../domain-errors";
import {
  DEFAULT_ENVIRONMENT_POLICY_FORMULA_CONFIG,
} from "../models";
import { EnvironmentPolicyRepository } from "../repository/environment-policy.repository";

export type EnvironmentPolicyService = {
  createPolicy: (
    input: CreateEnvironmentPolicyInput,
  ) => Effect.Effect<EnvironmentPolicyRow>;
  activatePolicy: (
    policyId: string,
  ) => Effect.Effect<
    EnvironmentPolicyRow,
    EnvironmentPolicyNotFound | EnvironmentPolicyActivationBlocked
  >;
  getActivePolicy: () => Effect.Effect<
    EnvironmentPolicyRow,
    ActiveEnvironmentPolicyNotFound
  >;
  listPolicies: (
    input: ListEnvironmentPoliciesInput,
  ) => Effect.Effect<EnvironmentPolicyPageResult>;
};

export class EnvironmentPolicyServiceTag extends Context.Tag(
  "EnvironmentPolicyService",
)<EnvironmentPolicyServiceTag, EnvironmentPolicyService>() {}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export const EnvironmentPolicyServiceLive = Layer.effect(
  EnvironmentPolicyServiceTag,
  Effect.gen(function* () {
    const repo = yield* EnvironmentPolicyRepository;

    const service: EnvironmentPolicyService = {
      createPolicy: input => repo.create({
        name: input.name.trim(),
        averageSpeedKmh: roundTo(input.averageSpeedKmh, 2),
        co2SavedPerKm: roundTo(input.co2SavedPerKm, 4),
        status: "INACTIVE",
        activeFrom: null,
        activeTo: null,
        formulaConfig: {
          ...DEFAULT_ENVIRONMENT_POLICY_FORMULA_CONFIG,
          return_scan_buffer_minutes: Math.trunc(
            input.returnScanBufferMinutes
            ?? DEFAULT_ENVIRONMENT_POLICY_FORMULA_CONFIG.return_scan_buffer_minutes,
          ),
          confidence_factor: roundTo(
            input.confidenceFactor
            ?? DEFAULT_ENVIRONMENT_POLICY_FORMULA_CONFIG.confidence_factor,
            2,
          ),
        },
      }),
      activatePolicy: policyId => repo.activatePolicy(policyId),
      getActivePolicy: () =>
        Effect.gen(function* () {
          const policy = yield* repo.findActive(new Date());
          if (!policy) {
            return yield* Effect.fail(new ActiveEnvironmentPolicyNotFound({
              reason: "MISSING_ACTIVE_POLICY",
            }));
          }

          /*
           * Legacy-data fallback: if historical rows contain multiple valid ACTIVE
           * policies, the repository returns the latest effective row. New writes
           * should still enforce the "one active policy at a time" rule separately.
           */
          return policy;
        }),
      listPolicies: input => repo.listPolicies(
        {
          status: input.status,
          search: input.search?.trim() || undefined,
        },
        {
          page: input.page ?? 1,
          pageSize: input.pageSize ?? 20,
          sortBy: input.sortBy ?? "created_at",
          sortOrder: input.sortOrder ?? "desc",
        },
      ),
    };

    return service;
  }),
);
