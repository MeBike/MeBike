import { AgenciesContracts } from "@mebike/shared";

export type AgenciesRoutes = typeof import("@mebike/shared")["serverRoutes"]["agencies"];

export type AgencySummary = AgenciesContracts.AgencySummary;
export type AgencyDetailResponse = AgenciesContracts.AgencyDetailResponse;
export type AgencyErrorResponse = AgenciesContracts.AgencyErrorResponse;
export type AgencyListResponse = AgenciesContracts.AgencyListResponse;
export type AgencyOperationalStatsResponse = AgenciesContracts.AgencyOperationalStatsResponse;
export type AgencyUpdateResponse = AgenciesContracts.AgencyUpdateResponse;
export type AgencyUpdateStatusResponse = AgenciesContracts.AgencyUpdateStatusResponse;

export const { AgencyErrorCodeSchema, agencyErrorMessages } = AgenciesContracts;
