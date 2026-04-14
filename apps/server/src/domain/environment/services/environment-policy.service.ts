import { Context, Effect, Layer } from "effect";

import type {
  CreateEnvironmentPolicyInput,
  EnvironmentPolicyRow,
} from "../models";

import {
  DEFAULT_ENVIRONMENT_POLICY_FORMULA_CONFIG,
} from "../models";
import { EnvironmentPolicyRepository } from "../repository/environment-policy.repository";

export type EnvironmentPolicyService = {
  createPolicy: (
    input: CreateEnvironmentPolicyInput,
  ) => Effect.Effect<EnvironmentPolicyRow>;
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
    };

    return service;
  }),
);
