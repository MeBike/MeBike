import type { EnvironmentContracts } from "@mebike/shared";

import type { EnvironmentPolicyRow } from "@/domain/environment";

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
    formula_config: policy.formulaConfig ?? {
      return_scan_buffer_minutes: 3,
      confidence_factor: 0.85,
      display_unit: "gCO2e",
      formula_version: "PHASE_1_TIME_SPEED",
      distance_source: "TIME_SPEED",
    },
    created_at: policy.createdAt.toISOString(),
    updated_at: policy.updatedAt.toISOString(),
  };
}
