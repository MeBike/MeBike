export type EnvironmentStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";

export type FormulaVersion = "PHASE_1_TIME_SPEED";

export type DistanceSource = "TIME_SPEED";

export type DistanceUnit = "gCO2e";

export interface FormulaConfig {
  return_scan_buffer_minutes: number;
  confidence_factor: number;
  display_unit: DistanceUnit;
  formula_version: FormulaVersion;
  distance_source: DistanceSource;
}
export interface Environment {
  id: string;
  name: string;
  average_speed_kmh: number;
  co2_saved_per_km: number;
  co2_saved_per_km_unit: string;
  status: EnvironmentStatus;
  active_from: string;
  active_to: string | null;
  formula_config: FormulaConfig;
  created_at: string;
  updated_at: string | null;
}