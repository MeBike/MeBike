import { createRoute } from "@hono/zod-openapi";

import {
  IncidentErrorCodeSchema,
  IncidentErrorResponseSchema,
} from "../../incidents/errors";
import { ServerErrorResponseSchema } from "../../schemas";
import { unauthorizedResponse } from "../helpers";
import {
  IncidentDetailSchema,
  IncidentIdParamSchema,
  IncidentListQuerySchema,
  IncidentListResponseSchema,
} from "./shared";

export const listIncidents = createRoute({
  method: "get",
  path: "/v1/incidents",
  tags: ["Incidents"],
  security: [{ bearerAuth: [] }],
  request: {
    query: IncidentListQuerySchema,
  },
  responses: {
    200: {
      description: "List incidents",
      content: {
        "application/json": { schema: IncidentListResponseSchema },
      },
    },
    400: {
      description: "Invalid query",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
          examples: {
            InvalidStatus: {
              value: {
                error: "Invalid query parameters",
                details: {
                  code: IncidentErrorCodeSchema.enum.INVALID_QUERY_PARAMS,
                  issues: [
                    {
                      path: "query.status",
                      message: "Expected enum value",
                      code: "invalid_enum_value",
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
  },
});

export const getIncident = createRoute({
  method: "get",
  path: "/v1/incidents/{incidentId}",
  tags: ["Incidents"],
  security: [{ bearerAuth: [] }],
  request: {
    params: IncidentIdParamSchema,
  },
  responses: {
    200: {
      description: "Get incident details",
      content: {
        "application/json": { schema: IncidentDetailSchema },
      },
    },
    400: {
      description: "Invalid path parameter",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Incident not found",
      content: {
        "application/json": {
          schema: IncidentErrorResponseSchema,
          examples: {
            NotFound: {
              value: {
                error: "Incident not found",
                details: {
                  code: IncidentErrorCodeSchema.enum.INCIDENT_NOT_FOUND,
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
  },
});

export const incidentsQueries = {
  listIncidents,
  getIncident,
} as const;
