import { IncidentsContracts } from "@mebike/shared";

export type IncidentRoutes = typeof import("@mebike/shared")["serverRoutes"]["incidents"];

export type IncidentSummary = IncidentsContracts.IncidentSummary;
export type IncidentNotFoundResponse = IncidentsContracts.IncidentNotFoundResponse;

export type IncidentListResponse = {
  data: IncidentSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export const { IncidentErrorCodeSchema, incidentErrorMessages } = IncidentsContracts;
