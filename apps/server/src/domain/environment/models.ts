import type { AccountStatus, Prisma as PrismaTypes } from "generated/prisma/client";

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
