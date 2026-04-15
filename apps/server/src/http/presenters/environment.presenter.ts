import type { EnvironmentContracts } from "@mebike/shared";

import {
  DEFAULT_ENVIRONMENT_POLICY_FORMULA_CONFIG,
  type EnvironmentImpactRow,
  type EnvironmentPolicyFormulaConfig,
  type EnvironmentPolicyRow,
} from "@/domain/environment";

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
        ? config.return_scan_buffer_minutes
        : defaults.return_scan_buffer_minutes,
    confidence_factor:
      typeof config.confidence_factor === "number"
        ? config.confidence_factor
        : defaults.confidence_factor,
    display_unit:
      config.display_unit === "gCO2e"
        ? config.display_unit
        : defaults.display_unit,
    formula_version:
      config.formula_version === "PHASE_1_TIME_SPEED"
        ? config.formula_version
        : defaults.formula_version,
    distance_source:
      config.distance_source === "TIME_SPEED"
        ? config.distance_source
        : defaults.distance_source,
  };
}

export function toContractEnvironmentPolicy(
  policy: EnvironmentPolicyRow,
): EnvironmentContracts.EnvironmentPolicy {
  return {
    id: policy.id,
    name: policy.name,
    average_speed_kmh: policy.averageSpeedKmh.toNumber(),
    co2_saved_per_km: policy.co2SavedPerKm.toNumber(),
    co2_saved_per_km_unit: "gCO2e/km",
    status: policy.status,
    active_from: policy.activeFrom?.toISOString() ?? null,
    active_to: policy.activeTo?.toISOString() ?? null,
    formula_config: normalizeFormulaConfig(policy.formulaConfig),
    created_at: policy.createdAt.toISOString(),
    updated_at: policy.updatedAt.toISOString(),
  };
}

export function toContractEnvironmentImpact(
  impact: EnvironmentImpactRow,
  alreadyCalculated: boolean,
): EnvironmentContracts.EnvironmentImpact {
  return {
    id: impact.id,
    user_id: impact.userId,
    rental_id: impact.rentalId,
    policy_id: impact.policyId,
    estimated_distance_km: impact.estimatedDistanceKm?.toNumber() ?? 0,
    co2_saved: impact.co2Saved.toNumber(),
    co2_saved_unit: "gCO2e",
    policy_snapshot: impact.policySnapshot,
    calculated_at: impact.calculatedAt.toISOString(),
    already_calculated: alreadyCalculated,
  };
}
