import type {
  AccountStatus,
  Prisma as PrismaTypes,
  RentalStatus,
} from "generated/prisma/client";

import type { PageResult } from "@/domain/shared/pagination";

export const DEFAULT_ENVIRONMENT_POLICY_FORMULA_CONFIG = {
  return_scan_buffer_minutes: 3,
  confidence_factor: 0.85,
  display_unit: "gCO2e",
  formula_version: "PHASE_1_TIME_SPEED",
  distance_source: "TIME_SPEED",
} as const;

export type EnvironmentPolicyFormulaConfig = {
  return_scan_buffer_minutes: number;
  confidence_factor: number;
  display_unit: "gCO2e";
  formula_version: "PHASE_1_TIME_SPEED";
  distance_source: "TIME_SPEED";
};

export type EnvironmentPolicyRow = {
  id: string;
  name: string;
  averageSpeedKmh: PrismaTypes.Decimal;
  co2SavedPerKm: PrismaTypes.Decimal;
  status: AccountStatus;
  activeFrom: Date | null;
  activeTo: Date | null;
  formulaConfig: EnvironmentPolicyFormulaConfig | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateEnvironmentPolicyInput = {
  name: string;
  averageSpeedKmh: number;
  co2SavedPerKm: number;
  returnScanBufferMinutes?: number;
  confidenceFactor?: number;
};

export type CreateEnvironmentPolicyData = {
  name: string;
  averageSpeedKmh: number;
  co2SavedPerKm: number;
  status: "INACTIVE";
  activeFrom: null;
  activeTo: null;
  formulaConfig: EnvironmentPolicyFormulaConfig;
};

export type EnvironmentPolicySortField =
  | "created_at"
  | "updated_at"
  | "active_from"
  | "name";

export type EnvironmentPolicySortOrder = "asc" | "desc";

export type ListEnvironmentPoliciesInput = {
  page?: number;
  pageSize?: number;
  status?: AccountStatus;
  search?: string;
  sortBy?: EnvironmentPolicySortField;
  sortOrder?: EnvironmentPolicySortOrder;
};

export type EnvironmentPolicyListFilter = {
  status?: AccountStatus;
  search?: string;
};

export type EnvironmentPolicyListPageRequest = {
  page: number;
  pageSize: number;
  sortBy: EnvironmentPolicySortField;
  sortOrder: EnvironmentPolicySortOrder;
};

export type EnvironmentPolicyPageResult = PageResult<EnvironmentPolicyRow>;

export type EnvironmentImpactPolicySnapshot = {
  policy_id: string;
  policy_name: string;
  average_speed_kmh: number;
  co2_saved_per_km: number;
  co2_saved_per_km_unit: "gCO2e/km";
  return_scan_buffer_minutes: number;
  confidence_factor: number;
  raw_rental_minutes: number;
  effective_ride_minutes: number;
  estimated_distance_km: number;
  co2_saved: number;
  co2_saved_unit: "gCO2e";
  distance_source: "TIME_SPEED";
  formula_version: "PHASE_1_TIME_SPEED";
  formula: string;
};

export type EnvironmentImpactRow = {
  id: string;
  userId: string;
  rentalId: string;
  policyId: string;
  estimatedDistanceKm: PrismaTypes.Decimal | null;
  co2Saved: PrismaTypes.Decimal;
  policySnapshot: EnvironmentImpactPolicySnapshot;
  calculatedAt: Date;
};

export type EnvironmentImpactSummaryRow = {
  totalTripsCounted: number;
  totalEstimatedDistanceKm: PrismaTypes.Decimal;
  totalCo2Saved: PrismaTypes.Decimal;
};

export type EnvironmentImpactHistorySortOrder = "asc" | "desc";

export type ListUserEnvironmentImpactHistoryInput = {
  page?: number;
  pageSize?: number;
  sortOrder?: EnvironmentImpactHistorySortOrder;
  dateFrom?: string;
  dateTo?: string;
};

export type EnvironmentImpactHistoryFilter = {
  userId: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type EnvironmentImpactHistoryPageRequest = {
  page: number;
  pageSize: number;
  sortOrder: EnvironmentImpactHistorySortOrder;
};

export type EnvironmentImpactHistoryPageResult =
  PageResult<EnvironmentImpactRow>;

export type EnvironmentImpactRentalRow = {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  status: RentalStatus;
};

export type CreateEnvironmentImpactData = {
  userId: string;
  rentalId: string;
  policyId: string;
  estimatedDistanceKm: number;
  co2Saved: number;
  policySnapshot: EnvironmentImpactPolicySnapshot;
};

export type EnvironmentImpactCalculationResult = {
  impact: EnvironmentImpactRow;
  alreadyCalculated: boolean;
};
