import { AgencyRequestsContracts } from "@mebike/shared";

export type AgencyRequestsRoutes = typeof import("@mebike/shared")["serverRoutes"]["agencyRequests"];

export const { AgencyRequestErrorCodeSchema, agencyRequestErrorMessages } = AgencyRequestsContracts;

export type AgencyRequest = AgencyRequestsContracts.AgencyRequest;
export type AgencyRequestDetailResponse = AgencyRequestsContracts.AgencyRequestDetailResponse;
export type AgencyRequestErrorResponse = AgencyRequestsContracts.AgencyRequestErrorResponse;
export type AgencyRequestListResponse = AgencyRequestsContracts.AgencyRequestListResponse;
export type AgencyRequestUserDetailResponse = AgencyRequestsContracts.AgencyRequestUserDetailResponse;
export type AgencyRequestUserListResponse = AgencyRequestsContracts.AgencyRequestUserListResponse;
