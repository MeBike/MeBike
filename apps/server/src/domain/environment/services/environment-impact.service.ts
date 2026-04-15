import { Context, Effect, Layer, Option } from "effect";

import type {
  EnvironmentImpactCalculationResult,
  EnvironmentImpactPolicySnapshot,
  EnvironmentImpactRentalRow,
  EnvironmentImpactSummaryRow,
  EnvironmentPolicyFormulaConfig,
  EnvironmentPolicyRow,
} from "../models";

import {
  ActiveEnvironmentPolicyNotFound,
  EnvironmentImpactAlreadyExists,
  EnvironmentImpactRentalNotCompleted,
  EnvironmentImpactRentalNotFound,
} from "../domain-errors";
import {
  DEFAULT_ENVIRONMENT_POLICY_FORMULA_CONFIG,
} from "../models";
import { EnvironmentImpactRepository } from "../repository/environment-impact.repository";
import { EnvironmentPolicyServiceTag } from "./environment-policy.service";

export type EnvironmentImpactService = {
  calculateFromRental: (
    rentalId: string,
  ) => Effect.Effect<
    EnvironmentImpactCalculationResult,
    | ActiveEnvironmentPolicyNotFound
    | EnvironmentImpactRentalNotFound
    | EnvironmentImpactRentalNotCompleted
  >;
  getMySummary: (
    userId: string,
  ) => Effect.Effect<EnvironmentImpactSummaryRow>;
};

export class EnvironmentImpactServiceTag extends Context.Tag(
  "EnvironmentImpactService",
)<EnvironmentImpactServiceTag, EnvironmentImpactService>() {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeFormulaConfig(
  value: EnvironmentPolicyRow["formulaConfig"],
): EnvironmentPolicyFormulaConfig {
  const config: Record<string, unknown> = isRecord(value) ? value : {};
  const defaults = DEFAULT_ENVIRONMENT_POLICY_FORMULA_CONFIG;

  return {
    return_scan_buffer_minutes:
      typeof config.return_scan_buffer_minutes === "number"
        ? Math.trunc(config.return_scan_buffer_minutes)
        : defaults.return_scan_buffer_minutes,
    confidence_factor:
      typeof config.confidence_factor === "number"
        ? config.confidence_factor
        : defaults.confidence_factor,
    display_unit: "gCO2e",
    formula_version: "PHASE_1_TIME_SPEED",
    distance_source: "TIME_SPEED",
  };
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function getRawRentalMinutes(rental: EnvironmentImpactRentalRow): number {
  const rawMinutes = typeof rental.durationMinutes === "number"
    ? Math.trunc(rental.durationMinutes)
    : rental.endTime
      ? Math.floor(
        (rental.endTime.getTime() - rental.startTime.getTime()) / 60_000,
      )
      : 0;

  return Math.max(0, rawMinutes);
}

function calculatePhaseOneImpact(
  rental: EnvironmentImpactRentalRow,
  policy: EnvironmentPolicyRow,
): EnvironmentImpactPolicySnapshot {
  const formulaConfig = normalizeFormulaConfig(policy.formulaConfig);
  const averageSpeedKmh = Math.max(0, policy.averageSpeedKmh.toNumber());
  const co2SavedPerKm = Math.max(0, policy.co2SavedPerKm.toNumber());
  const returnScanBufferMinutes = Math.max(
    0,
    formulaConfig.return_scan_buffer_minutes,
  );
  const confidenceFactor = Math.min(
    1,
    Math.max(0, formulaConfig.confidence_factor),
  );
  const rawRentalMinutes = getRawRentalMinutes(rental);
  const effectiveRideMinutes = Math.max(
    0,
    rawRentalMinutes - returnScanBufferMinutes,
  );
  const estimatedDistanceKm = roundTo(
    (effectiveRideMinutes / 60) * averageSpeedKmh,
    2,
  );
  const co2Saved = Math.round(
    estimatedDistanceKm * co2SavedPerKm * confidenceFactor,
  );

  return {
    policy_id: policy.id,
    policy_name: policy.name,
    average_speed_kmh: averageSpeedKmh,
    co2_saved_per_km: co2SavedPerKm,
    co2_saved_per_km_unit: "gCO2e/km",
    return_scan_buffer_minutes: returnScanBufferMinutes,
    confidence_factor: confidenceFactor,
    raw_rental_minutes: rawRentalMinutes,
    effective_ride_minutes: effectiveRideMinutes,
    estimated_distance_km: estimatedDistanceKm,
    co2_saved: co2Saved,
    co2_saved_unit: "gCO2e",
    distance_source: "TIME_SPEED",
    formula_version: "PHASE_1_TIME_SPEED",
    formula:
      "co2_saved = round(estimated_distance_km * co2_saved_per_km * confidence_factor)",
  };
}

export const EnvironmentImpactServiceLive = Layer.effect(
  EnvironmentImpactServiceTag,
  Effect.gen(function* () {
    const impactRepo = yield* EnvironmentImpactRepository;
    const policyService = yield* EnvironmentPolicyServiceTag;

    const service: EnvironmentImpactService = {
      getMySummary: userId => impactRepo.getUserEnvironmentSummary(userId),
      calculateFromRental: rentalId =>
        Effect.gen(function* () {
          const existing = yield* impactRepo.findImpactByRentalId(rentalId);
          if (Option.isSome(existing)) {
            return {
              impact: existing.value,
              alreadyCalculated: true,
            };
          }

          const rentalOpt = yield* impactRepo
            .getRentalForEnvironmentCalculation(rentalId);
          if (Option.isNone(rentalOpt)) {
            return yield* Effect.fail(
              new EnvironmentImpactRentalNotFound({ rentalId }),
            );
          }

          const rental = rentalOpt.value;
          if (rental.status !== "COMPLETED") {
            return yield* Effect.fail(
              new EnvironmentImpactRentalNotCompleted({
                rentalId,
                status: rental.status,
              }),
            );
          }

          const policy = yield* policyService.getActivePolicy();
          const snapshot = calculatePhaseOneImpact(rental, policy);

          return yield* impactRepo.createImpact({
            userId: rental.userId,
            rentalId: rental.id,
            policyId: policy.id,
            estimatedDistanceKm: snapshot.estimated_distance_km,
            co2Saved: snapshot.co2_saved,
            policySnapshot: snapshot,
          }).pipe(
            Effect.map(impact => ({
              impact,
              alreadyCalculated: false,
            })),
            Effect.catchTag(
              "EnvironmentImpactAlreadyExists",
              (error: EnvironmentImpactAlreadyExists) =>
                Effect.gen(function* () {
                  const racedExisting = yield* impactRepo
                    .findImpactByRentalId(error.rentalId);
                  if (Option.isSome(racedExisting)) {
                    return {
                      impact: racedExisting.value,
                      alreadyCalculated: true,
                    };
                  }

                  return yield* Effect.die(error);
                }),
            ),
          );
        }),
    };

    return service;
  }),
);
