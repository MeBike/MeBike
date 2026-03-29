import { AgenciesContracts } from "@mebike/shared";

export type AgenciesRoutes = typeof import("@mebike/shared")["serverRoutes"]["agencies"];

export type AgencySummary = AgenciesContracts.AgencySummary;
export type AgencyListResponse = AgenciesContracts.AgencyListResponse;
