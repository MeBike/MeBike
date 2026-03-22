import { createRoute } from "@hono/zod-openapi";

import { unauthorizedResponse } from "../helpers";
import {
  IncidentCreateBodySchema,
  IncidentIdParamSchema,
  IncidentStatusPatchSchema,
  IncidentSummarySchema,
  IncidentUpdateBodySchema,
} from "./shared";
import { IncidentErrorResponseSchema } from "../../incident/errors";

export const createIncident = createRoute({
  method: "post",
  path: "/v1/incidents",
  tags: ["Incidents"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: IncidentCreateBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: "Incident created",
      content: {
        "application/json": { schema: IncidentSummarySchema },
      },
    },
    400: {
      description: "Invalid payload",
      content: {
        "application/json": {
          schema: IncidentErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
  },
});

export const updateIncident = createRoute({
  method: "put",
  path: "/v1/incidents/{incidentId}",
  tags: ["Incidents"],
  security: [{ bearerAuth: [] }],
  request: {
    params: IncidentIdParamSchema,
    body: {
      content: {
        "application/json": { schema: IncidentUpdateBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Incident updated",
      content: {
        "application/json": { schema: IncidentSummarySchema },
      },
    },
    400: {
      description: "Invalid payload",
      content: {
        "application/json": {
          schema: IncidentErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Incident not found",
      content: {
        "application/json": {
          schema: IncidentErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
  },
});

export const updateIncidentStatus = createRoute({
  method: "patch",
  path: "/v1/incidents/{incidentId}",
  tags: ["Incidents"],
  security: [{ bearerAuth: [] }],
  request: {
    params: IncidentIdParamSchema,
    body: {
      content: {
        "application/json": { schema: IncidentStatusPatchSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Supplier status updated",
      content: {
        "application/json": { schema: IncidentSummarySchema },
      },
    },
    400: {
      description: "Invalid status",
      content: {
        "application/json": {
          schema: IncidentErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Incident not found",
      content: {
        "application/json": {
          schema: IncidentErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
  },
});

export const incidentsMutations = {
  createIncident,
  updateIncident,
  updateIncidentStatus,
} as const;
