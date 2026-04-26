import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import {
  TechnicianTeamCommandServiceTag,
  TechnicianTeamQueryServiceTag,
} from "@/domain/technician-teams";
import {
  toContractAvailableTechnicianTeam,
  toContractTechnicianTeamSummary,
} from "@/http/presenters/technician-teams.presenter";

import type {
  TechnicianTeamAvailableListResponse,
  TechnicianTeamErrorResponse,
  TechnicianTeamListResponse,
  TechnicianTeamsRoutes,
  TechnicianTeamSummary,
} from "./shared";

import {
  TechnicianTeamErrorCodeSchema,
  technicianTeamErrorMessages,
} from "./shared";

const listTechnicianTeams: RouteHandler<TechnicianTeamsRoutes["adminList"]> = async (c) => {
  const query = c.req.valid("query");

  const eff = Effect.flatMap(TechnicianTeamQueryServiceTag, service =>
    service.listTechnicianTeams({
      stationId: query.stationId,
      availabilityStatus: query.availabilityStatus,
    }));

  const result = await c.var.runPromise(eff);

  return c.json<TechnicianTeamListResponse, 200>({
    data: result.map(toContractTechnicianTeamSummary),
  }, 200);
};

const listAvailableTechnicianTeams: RouteHandler<TechnicianTeamsRoutes["adminAvailable"]> = async (c) => {
  const query = c.req.valid("query");

  const eff = Effect.flatMap(TechnicianTeamQueryServiceTag, service =>
    service.listAvailableTechnicianTeams({
      stationId: query.stationId,
    }));

  const result = await c.var.runPromise(eff);

  return c.json<TechnicianTeamAvailableListResponse, 200>({
    data: result.map(toContractAvailableTechnicianTeam),
  }, 200);
};

const createTechnicianTeam: RouteHandler<TechnicianTeamsRoutes["adminCreate"]> = async (c) => {
  const body = c.req.valid("json");

  const eff = Effect.flatMap(TechnicianTeamCommandServiceTag, service =>
    service.createTechnicianTeam({
      name: body.name,
      stationId: body.stationId,
      availabilityStatus: body.availabilityStatus,
    }));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  if (result._tag === "Right") {
    return c.json<TechnicianTeamSummary, 201>(toContractTechnicianTeamSummary(result.right), 201);
  }

  return Match.value(result.left).pipe(
    Match.tag("TechnicianTeamInternalStationRequired", ({ stationId, stationType }) =>
      c.json<TechnicianTeamErrorResponse, 400>({
        error: technicianTeamErrorMessages.TECHNICIAN_TEAM_INTERNAL_STATION_REQUIRED,
        details: {
          code: TechnicianTeamErrorCodeSchema.enum.TECHNICIAN_TEAM_INTERNAL_STATION_REQUIRED,
          stationId,
          stationType,
        },
      }, 400)),
    Match.tag("TechnicianTeamStationAlreadyAssigned", ({ stationId, teamId }) =>
      c.json<TechnicianTeamErrorResponse, 400>({
        error: technicianTeamErrorMessages.TECHNICIAN_TEAM_STATION_ALREADY_ASSIGNED,
        details: {
          code: TechnicianTeamErrorCodeSchema.enum.TECHNICIAN_TEAM_STATION_ALREADY_ASSIGNED,
          stationId,
          teamId,
        },
      }, 400)),
    Match.tag("TechnicianTeamStationNotFound", ({ stationId }) =>
      c.json<TechnicianTeamErrorResponse, 400>({
        error: technicianTeamErrorMessages.TECHNICIAN_TEAM_STATION_NOT_FOUND,
        details: {
          code: TechnicianTeamErrorCodeSchema.enum.TECHNICIAN_TEAM_STATION_NOT_FOUND,
          stationId,
        },
      }, 400)),
    Match.orElse((err) => {
      throw err;
    }),
  );
};

const updateTechnicianTeam: RouteHandler<TechnicianTeamsRoutes["adminUpdate"]> = async (c) => {
  const { teamId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = Effect.flatMap(TechnicianTeamCommandServiceTag, service =>
    service.updateTechnicianTeam(teamId, {
      name: body.name,
      availabilityStatus: body.availabilityStatus,
    }));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  if (result._tag === "Right") {
    return c.json<TechnicianTeamSummary, 200>(toContractTechnicianTeamSummary(result.right), 200);
  }

  return Match.value(result.left).pipe(
    Match.tag("TechnicianTeamNotFound", ({ id }) =>
      c.json<TechnicianTeamErrorResponse, 404>({
        error: technicianTeamErrorMessages.TECHNICIAN_TEAM_NOT_FOUND,
        details: {
          code: TechnicianTeamErrorCodeSchema.enum.TECHNICIAN_TEAM_NOT_FOUND,
          teamId: id,
        },
      }, 404)),
    Match.orElse((err) => {
      throw err;
    }),
  );
};

export const TechnicianTeamAdminController = {
  createTechnicianTeam,
  listAvailableTechnicianTeams,
  listTechnicianTeams,
  updateTechnicianTeam,
} as const;
