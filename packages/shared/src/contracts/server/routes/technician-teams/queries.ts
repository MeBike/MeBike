import { createRoute, z } from "@hono/zod-openapi";

import { forbiddenResponse, unauthorizedResponse } from "../helpers";
import {
  TechnicianTeamAvailableListResponseSchema,
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

export const technicianTeamQueries = {
  adminAvailable: adminAvailableTechnicianTeamsRoute,
  adminList: adminListTechnicianTeamsRoute,
} as const;
