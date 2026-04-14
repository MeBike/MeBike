import { createRoute } from "@hono/zod-openapi";

import { forbiddenResponse, unauthorizedResponse } from "../helpers";
import {
  EnvironmentErrorCodeSchema,
  EnvironmentPolicyListResponseSchema,
  EnvironmentPolicySchema,
  ListEnvironmentPoliciesQuerySchema,
  ServerErrorResponseSchema,
  environmentErrorMessages,
} from "./shared";

export const listEnvironmentPolicies = createRoute({
  method: "get",
  path: "/environment/policies",
  tags: ["Environment"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ListEnvironmentPoliciesQuerySchema,
  },
  responses: {
    200: {
      description: "List Environment Policies for admin config/history screens",
      content: {
        "application/json": {
          schema: EnvironmentPolicyListResponseSchema,
          examples: {
            EnvironmentPolicyList: {
              value: {
                items: [
                  {
                    id: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
                    name: "Default Environment Policy v1",
                    average_speed_kmh: 12,
                    co2_saved_per_km: 75,
                    co2_saved_per_km_unit: "gCO2e/km",
                    status: "ACTIVE",
                    active_from: "2026-04-15T00:00:00.000Z",
                    active_to: null,
                    formula_config: {
                      return_scan_buffer_minutes: 3,
                      confidence_factor: 0.85,
                      display_unit: "gCO2e",
                      formula_version: "PHASE_1_TIME_SPEED",
                      distance_source: "TIME_SPEED",
                    },
                    created_at: "2026-04-15T01:00:00.000Z",
                    updated_at: "2026-04-15T01:00:00.000Z",
                  },
                ],
                page: 1,
                pageSize: 20,
                totalItems: 1,
                totalPages: 1,
              },
            },
            EmptyEnvironmentPolicyList: {
              value: {
                items: [],
                page: 1,
                pageSize: 20,
                totalItems: 0,
                totalPages: 0,
              },
            },
          },
        },
      },
    },
    400: {
      description: "Invalid query parameters",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});

export const getActiveEnvironmentPolicy = createRoute({
  method: "get",
  path: "/environment/policies/active",
  tags: ["Environment"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Get the currently active Environment Policy used for Phase 1 CO2 saved calculation",
      content: {
        "application/json": {
          schema: EnvironmentPolicySchema,
          examples: {
            ActiveEnvironmentPolicy: {
              value: {
                id: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
                name: "Default Environment Policy v1",
                average_speed_kmh: 12,
                co2_saved_per_km: 75,
                co2_saved_per_km_unit: "gCO2e/km",
                status: "ACTIVE",
                active_from: "2026-04-15T00:00:00.000Z",
                active_to: null,
                formula_config: {
                  return_scan_buffer_minutes: 3,
                  confidence_factor: 0.85,
                  display_unit: "gCO2e",
                  formula_version: "PHASE_1_TIME_SPEED",
                  distance_source: "TIME_SPEED",
                },
                created_at: "2026-04-15T01:00:00.000Z",
                updated_at: "2026-04-15T01:00:00.000Z",
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: {
      description: "No active environment policy found",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
          examples: {
            ActiveEnvironmentPolicyNotFound: {
              value: {
                error: environmentErrorMessages.ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND,
                details: {
                  code: EnvironmentErrorCodeSchema.enum.ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND,
                },
              },
            },
          },
        },
      },
    },
  },
});

export const environmentQueries = {
  listEnvironmentPolicies,
  getActiveEnvironmentPolicy,
} as const;
