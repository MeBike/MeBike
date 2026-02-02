import { StationsContracts } from "@mebike/shared";

export type StationsRoutes = typeof import("@mebike/shared")["serverRoutes"]["stations"];

export const { StationErrorCodeSchema, stationErrorMessages } = StationsContracts;

export type StationSummary = StationsContracts.StationSummary;
export type StationErrorResponse = StationsContracts.StationErrorResponse;
export type StationListResponse = StationsContracts.StationListResponse;
