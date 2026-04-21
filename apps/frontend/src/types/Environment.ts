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




export interface Co2RecordItem {
  id: string;
  user_id: string;
  rental_id: string;
  policy_id: string;
  estimated_distance_km: number;
  co2_saved: number;
  co2_saved_unit: string;
  distance_source: DistanceSource;
  raw_rental_minutes: number;
  effective_ride_minutes: number;
  calculated_at: string; 
}
export interface PolicySnapshot {
  policy_id: string;
  policy_name: string;
  average_speed_kmh: number;
  co2_saved_per_km: number;
  co2_saved_per_km_unit: string;
  return_scan_buffer_minutes: number;
  confidence_factor: number;
  raw_rental_minutes: number;
  effective_ride_minutes: number;
  estimated_distance_km: number;
  co2_saved: number;
  co2_saved_unit: string;
  distance_source: DistanceSource;
  formula_version: FormulaVersion;
}
export interface Co2Record {
  id: string;
  user_id: string;
  rental_id: string;
  policy_id: string;
  estimated_distance_km: number;
  co2_saved: number;
  co2_saved_unit: string;
  raw_rental_minutes: number;
  effective_ride_minutes: number;
  return_scan_buffer_minutes: number;
  average_speed_kmh: number;
  co2_saved_per_km: number;
  co2_saved_per_km_unit: string;
  confidence_factor: number;
  distance_source: DistanceSource;
  formula_version: FormulaVersion;
  policy_snapshot: PolicySnapshot;
  calculated_at: string;
}