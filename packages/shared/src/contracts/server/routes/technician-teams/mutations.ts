import { createRoute } from "@hono/zod-openapi";

import { forbiddenResponse, unauthorizedResponse } from "../helpers";
import {
  TechnicianTeamCreateBodySchema,
  TechnicianTeamErrorCodeSchema,
  TechnicianTeamErrorResponseSchema,
  TechnicianTeamIdParamSchema,
  TechnicianTeamSummarySchema,
  TechnicianTeamUpdateBodySchema,
} from "./shared";

export const adminCreateTechnicianTeamRoute = createRoute({
  method: "post",
  path: "/v1/admin/technician-teams",
  tags: ["Technician Teams"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: TechnicianTeamCreateBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Technician team created",
      content: {
        "application/json": {
          schema: TechnicianTeamSummarySchema,
        },
      },
    },
    400: {
      description: "Invalid payload or station not found",
      content: {
        "application/json": {
          schema: TechnicianTeamErrorResponseSchema,
          examples: {
            InternalStationRequired: {
              value: {
                error: "Technician teams require an internal station",
                details: {
                  code: TechnicianTeamErrorCodeSchema.enum.TECHNICIAN_TEAM_INTERNAL_STATION_REQUIRED,
                  stationId: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
                  stationType: "AGENCY",
                },
              },
            },
            StationNotFound: {
              value: {
                error: "Station not found for technician team",
                details: {
                  code: TechnicianTeamErrorCodeSchema.enum.TECHNICIAN_TEAM_STATION_NOT_FOUND,
                  stationId: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});

export const adminUpdateTechnicianTeamRoute = createRoute({
  method: "patch",
  path: "/v1/admin/technician-teams/{teamId}",
  tags: ["Technician Teams"],
  security: [{ bearerAuth: [] }],
  request: {
    params: TechnicianTeamIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: TechnicianTeamUpdateBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Technician team updated",
      content: {
        "application/json": {
          schema: TechnicianTeamSummarySchema,
        },
      },
    },
    404: {
      description: "Technician team not found",
      content: {
        "application/json": {
          schema: TechnicianTeamErrorResponseSchema,
          examples: {
            TeamNotFound: {
              value: {
                error: "Technician team not found",
                details: {
                  code: TechnicianTeamErrorCodeSchema.enum.TECHNICIAN_TEAM_NOT_FOUND,
                  teamId: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});

export const technicianTeamMutations = {
  adminCreate: adminCreateTechnicianTeamRoute,
  adminUpdate: adminUpdateTechnicianTeamRoute,
} as const;
