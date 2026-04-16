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

export const TechnicianTeamAdminController = {
  createTechnicianTeam,
  listAvailableTechnicianTeams,
  listTechnicianTeams,
} as const;
