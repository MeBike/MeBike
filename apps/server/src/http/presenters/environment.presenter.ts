import type { EnvironmentContracts } from "@mebike/shared";

import type {
  EnvironmentImpactRow,
  EnvironmentImpactSummaryRow,
  EnvironmentPolicyFormulaConfig,
  EnvironmentPolicyRow,
} from "@/domain/environment";

import {
  DEFAULT_ENVIRONMENT_POLICY_FORMULA_CONFIG,
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

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function readIntegerFromSnapshot(
  snapshot: EnvironmentImpactRow["policySnapshot"],
  key:
    | "raw_rental_minutes"
    | "effective_ride_minutes"
    | "return_scan_buffer_minutes",
): number | null {
  const value = isRecord(snapshot) ? snapshot[key] : undefined;
  return typeof value === "number" && Number.isFinite(value)
    ? Math.trunc(value)
    : null;
}

function readNumberFromSnapshot(
  snapshot: EnvironmentImpactRow["policySnapshot"],
  key:
    | "average_speed_kmh"
    | "co2_saved_per_km"
    | "confidence_factor",
): number | null {
  const value = isRecord(snapshot) ? snapshot[key] : undefined;
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

function readDistanceSourceFromSnapshot(
  snapshot: EnvironmentImpactRow["policySnapshot"],
): "TIME_SPEED" | null {
  const value = isRecord(snapshot) ? snapshot.distance_source : undefined;
  return value === "TIME_SPEED" ? value : null;
}

function readCo2SavedPerKmUnitFromSnapshot(
  snapshot: EnvironmentImpactRow["policySnapshot"],
): "gCO2e/km" | null {
  const value = isRecord(snapshot) ? snapshot.co2_saved_per_km_unit : undefined;
  return value === "gCO2e/km" ? value : null;
}

function readFormulaVersionFromSnapshot(
  snapshot: EnvironmentImpactRow["policySnapshot"],
): "PHASE_1_TIME_SPEED" | null {
  const value = isRecord(snapshot) ? snapshot.formula_version : undefined;
  return value === "PHASE_1_TIME_SPEED" ? value : null;
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

export function toContractEnvironmentImpactHistoryItem(
  impact: EnvironmentImpactRow,
): EnvironmentContracts.EnvironmentImpactHistoryItem {
  return {
    id: impact.id,
    rental_id: impact.rentalId,
    policy_id: impact.policyId,
    estimated_distance_km: roundTo(
      impact.estimatedDistanceKm?.toNumber() ?? 0,
      2,
    ),
    co2_saved: Math.round(impact.co2Saved.toNumber()),
    co2_saved_unit: "gCO2e",
    distance_source: readDistanceSourceFromSnapshot(impact.policySnapshot),
    raw_rental_minutes: readIntegerFromSnapshot(
      impact.policySnapshot,
      "raw_rental_minutes",
    ),
    effective_ride_minutes: readIntegerFromSnapshot(
      impact.policySnapshot,
      "effective_ride_minutes",
    ),
    calculated_at: impact.calculatedAt.toISOString(),
  };
}

export function toContractAdminEnvironmentImpactListItem(
  impact: EnvironmentImpactRow,
): EnvironmentContracts.AdminEnvironmentImpactListItem {
  return {
    ...toContractEnvironmentImpactHistoryItem(impact),
    user_id: impact.userId,
  };
}

export function toContractEnvironmentImpactDetail(
  impact: EnvironmentImpactRow,
): EnvironmentContracts.EnvironmentImpactDetail {
  return {
    id: impact.id,
    rental_id: impact.rentalId,
    policy_id: impact.policyId,
    estimated_distance_km: roundTo(
      impact.estimatedDistanceKm?.toNumber() ?? 0,
      2,
    ),
    co2_saved: Math.round(impact.co2Saved.toNumber()),
    co2_saved_unit: "gCO2e",
    raw_rental_minutes: readIntegerFromSnapshot(
      impact.policySnapshot,
      "raw_rental_minutes",
    ),
    effective_ride_minutes: readIntegerFromSnapshot(
      impact.policySnapshot,
      "effective_ride_minutes",
    ),
    return_scan_buffer_minutes: readIntegerFromSnapshot(
      impact.policySnapshot,
      "return_scan_buffer_minutes",
    ),
    average_speed_kmh: readNumberFromSnapshot(
      impact.policySnapshot,
      "average_speed_kmh",
    ),
    co2_saved_per_km: readNumberFromSnapshot(
      impact.policySnapshot,
      "co2_saved_per_km",
    ),
    co2_saved_per_km_unit: readCo2SavedPerKmUnitFromSnapshot(
      impact.policySnapshot,
    ),
    confidence_factor: readNumberFromSnapshot(
      impact.policySnapshot,
      "confidence_factor",
    ),
    distance_source: readDistanceSourceFromSnapshot(impact.policySnapshot),
    formula_version: readFormulaVersionFromSnapshot(impact.policySnapshot),
    policy_snapshot: impact.policySnapshot,
    calculated_at: impact.calculatedAt.toISOString(),
  };
}

export function toContractAdminEnvironmentImpactDetail(
  impact: EnvironmentImpactRow,
): EnvironmentContracts.AdminEnvironmentImpactDetail {
  return {
    ...toContractEnvironmentImpactDetail(impact),
    user_id: impact.userId,
  };
}

export function toContractEnvironmentSummary(
  summary: EnvironmentImpactSummaryRow,
): EnvironmentContracts.EnvironmentSummary {
  return {
    total_trips_counted: summary.totalTripsCounted,
    total_estimated_distance_km: roundTo(
      summary.totalEstimatedDistanceKm.toNumber(),
      2,
    ),
    total_co2_saved: Math.round(summary.totalCo2Saved.toNumber()),
    co2_saved_unit: "gCO2e",
  };
}

export function toContractAdminEnvironmentUserSummary(
  userId: string,
  summary: EnvironmentImpactSummaryRow,
): EnvironmentContracts.AdminEnvironmentUserSummary {
  return {
    user_id: userId,
    ...toContractEnvironmentSummary(summary),
  };
}
