import { createRoute, z } from "@hono/zod-openapi";

import { forbiddenResponse, unauthorizedResponse } from "../helpers";
import {
  TechnicianTeamAvailableListResponseSchema,
  TechnicianTeamDetailResponseSchema,
  TechnicianTeamErrorCodeSchema,
  TechnicianTeamErrorResponseSchema,
  TechnicianTeamIdParamSchema,
  TechnicianTeamListQuerySchema,
  TechnicianTeamListResponseSchema,
} from "./shared";

export const adminListTechnicianTeamsRoute = createRoute({
  method: "get",
  path: "/v1/admin/technician-teams",
  tags: ["Technician Teams"],
  security: [{ bearerAuth: [] }],
  request: {
    query: TechnicianTeamListQuerySchema,
  },
  responses: {
    200: {
      description: "Admin list of technician teams",
      content: {
        "application/json": {
          schema: TechnicianTeamListResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});

export const adminAvailableTechnicianTeamsRoute = createRoute({
  method: "get",
  path: "/v1/admin/technician-teams/available",
  tags: ["Technician Teams"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      stationId: z.uuidv7().optional(),
    }),
  },
  responses: {
    200: {
      description: "Admin list of available technician teams for assignment",
      content: {
        "application/json": {
          schema: TechnicianTeamAvailableListResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});

export const adminGetTechnicianTeamRoute = createRoute({
  method: "get",
  path: "/v1/admin/technician-teams/{teamId}",
  tags: ["Technician Teams"],
  security: [{ bearerAuth: [] }],
  request: {
    params: TechnicianTeamIdParamSchema,
  },
  responses: {
    200: {
      description: "Admin technician team detail",
      content: {
        "application/json": {
          schema: TechnicianTeamDetailResponseSchema,
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

export const technicianTeamQueries = {
  adminAvailable: adminAvailableTechnicianTeamsRoute,
  adminGet: adminGetTechnicianTeamRoute,
  adminList: adminListTechnicianTeamsRoute,
} as const;
