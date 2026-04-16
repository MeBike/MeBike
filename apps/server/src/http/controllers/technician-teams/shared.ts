import { TechnicianTeamsContracts } from "@mebike/shared";

export type TechnicianTeamsRoutes = typeof import("@mebike/shared")["serverRoutes"]["technicianTeams"];

export const { TechnicianTeamErrorCodeSchema, technicianTeamErrorMessages } = TechnicianTeamsContracts;

export type TechnicianTeamSummary = TechnicianTeamsContracts.TechnicianTeamSummary;
export type TechnicianTeamListResponse = TechnicianTeamsContracts.TechnicianTeamListResponse;
export type TechnicianTeamAvailableListResponse = TechnicianTeamsContracts.TechnicianTeamAvailableListResponse;
export type TechnicianTeamErrorResponse = TechnicianTeamsContracts.TechnicianTeamErrorResponse;
