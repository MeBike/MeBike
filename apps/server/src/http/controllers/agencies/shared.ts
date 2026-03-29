import { AgenciesContracts } from "@mebike/shared";

export type AgenciesRoutes = typeof import("@mebike/shared")["serverRoutes"]["agencies"];

export type AgencySummary = AgenciesContracts.AgencySummary;
export type AgencyDetailResponse = AgenciesContracts.AgencyDetailResponse;
export type AgencyErrorResponse = AgenciesContracts.AgencyErrorResponse;
export type AgencyListResponse = AgenciesContracts.AgencyListResponse;

export const { AgencyErrorCodeSchema, agencyErrorMessages } = AgenciesContracts;
