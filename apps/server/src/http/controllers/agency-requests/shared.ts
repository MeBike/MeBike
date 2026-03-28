import { AgencyRequestsContracts } from "@mebike/shared";

export type AgencyRequestsRoutes = typeof import("@mebike/shared")["serverRoutes"]["agencyRequests"];

export type AgencyRequest = AgencyRequestsContracts.AgencyRequest;
export type AgencyRequestListResponse = AgencyRequestsContracts.AgencyRequestListResponse;
