import type { AccountStatus, Prisma as PrismaTypes } from "generated/prisma/client";

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
