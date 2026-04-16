import { createRoute } from "@hono/zod-openapi";

import { forbiddenResponse, unauthorizedResponse } from "../helpers";
import {
  EnvironmentErrorCodeSchema,
  EnvironmentImpactDetailSchema,
  EnvironmentImpactRentalIdParamsSchema,
  EnvironmentImpactHistoryResponseSchema,
  EnvironmentPolicyListResponseSchema,
  EnvironmentPolicySchema,
  EnvironmentSummarySchema,
  ListEnvironmentImpactHistoryQuerySchema,
  ListEnvironmentPoliciesQuerySchema,
  ServerErrorResponseSchema,
  environmentErrorMessages,
} from "./shared";

export const getMyEnvironmentSummary = createRoute({
  method: "get",
  path: "/environment/me/summary",
  tags: ["Environment"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description:
        "Get accumulated Environment Impact summary for the authenticated account. This reads only environmental_impact_stats and does not calculate new impact.",
      content: {
        "application/json": {
          schema: EnvironmentSummarySchema,
          examples: {
            EnvironmentSummaryWithData: {
              value: {
                total_trips_counted: 3,
                total_estimated_distance_km: 7.4,
                total_co2_saved: 472,
                co2_saved_unit: "gCO2e",
              },
            },
            EmptyEnvironmentSummary: {
              value: {
                total_trips_counted: 0,
                total_estimated_distance_km: 0,
                total_co2_saved: 0,
                co2_saved_unit: "gCO2e",
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("User"),
  },
});

export const getMyEnvironmentImpactHistory = createRoute({
  method: "get",
  path: "/environment/me/history",
  tags: ["Environment"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ListEnvironmentImpactHistoryQuerySchema,
  },
  responses: {
    200: {
      description:
        "Get paginated calculated Environment Impact history for the authenticated account. This reads only environmental_impact_stats and does not calculate new impact.",
      content: {
        "application/json": {
          schema: EnvironmentImpactHistoryResponseSchema,
          examples: {
            EnvironmentImpactHistoryWithData: {
              value: {
                data: [
                  {
                    id: "018fa0f9-8f3b-752c-8f3d-2c9000000001",
                    rental_id: "018fa0f9-8f3b-752c-8f3d-2c9000000003",
                    policy_id: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
                    estimated_distance_km: 4,
                    co2_saved: 255,
                    co2_saved_unit: "gCO2e",
                    distance_source: "TIME_SPEED",
                    raw_rental_minutes: 23,
                    effective_ride_minutes: 20,
                    calculated_at: "2026-04-15T10:30:00.000Z",
                  },
                ],
                pagination: {
                  page: 1,
                  pageSize: 20,
                  total: 1,
                  totalPages: 1,
                },
              },
            },
            EmptyEnvironmentImpactHistory: {
              value: {
                data: [],
                pagination: {
                  page: 1,
                  pageSize: 20,
                  total: 0,
                  totalPages: 0,
                },
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
    403: forbiddenResponse("User"),
  },
});

export const getMyEnvironmentImpactByRental = createRoute({
  method: "get",
  path: "/environment/me/rentals/{rentalId}",
  tags: ["Environment"],
  security: [{ bearerAuth: [] }],
  request: {
    params: EnvironmentImpactRentalIdParamsSchema,
  },
  responses: {
    200: {
      description:
        "Get detailed calculated Environment Impact for one rental owned by the authenticated account. This reads only environmental_impact_stats and does not calculate new impact.",
      content: {
        "application/json": {
          schema: EnvironmentImpactDetailSchema,
          examples: {
            EnvironmentImpactDetail: {
              value: {
                id: "018fa0f9-8f3b-752c-8f3d-2c9000000001",
                rental_id: "018fa0f9-8f3b-752c-8f3d-2c9000000003",
                policy_id: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
                estimated_distance_km: 4,
                co2_saved: 255,
                co2_saved_unit: "gCO2e",
                raw_rental_minutes: 23,
                effective_ride_minutes: 20,
                return_scan_buffer_minutes: 3,
                average_speed_kmh: 12,
                co2_saved_per_km: 75,
                co2_saved_per_km_unit: "gCO2e/km",
                confidence_factor: 0.85,
                distance_source: "TIME_SPEED",
                formula_version: "PHASE_1_TIME_SPEED",
                policy_snapshot: {
                  policy_id: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
                  policy_name: "Default Environment Policy v1",
                  average_speed_kmh: 12,
                  co2_saved_per_km: 75,
                  co2_saved_per_km_unit: "gCO2e/km",
                  return_scan_buffer_minutes: 3,
                  confidence_factor: 0.85,
                  raw_rental_minutes: 23,
                  effective_ride_minutes: 20,
                  estimated_distance_km: 4,
                  co2_saved: 255,
                  co2_saved_unit: "gCO2e",
                  distance_source: "TIME_SPEED",
                  formula_version: "PHASE_1_TIME_SPEED",
                },
                calculated_at: "2026-04-15T10:30:00.000Z",
              },
            },
          },
        },
      },
    },
    400: {
      description: "Invalid rentalId path parameter",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("User"),
    404: {
      description:
        "Environment impact not found for this rental and authenticated account",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
          examples: {
            EnvironmentImpactNotFound: {
              value: {
                error: environmentErrorMessages.ENVIRONMENT_IMPACT_NOT_FOUND,
                details: {
                  code: EnvironmentErrorCodeSchema.enum.ENVIRONMENT_IMPACT_NOT_FOUND,
                },
              },
            },
          },
        },
      },
    },
  },
});

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
                data: [
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
                pagination: {
                  page: 1,
                  pageSize: 20,
                  total: 1,
                  totalPages: 1,
                },
              },
            },
            EmptyEnvironmentPolicyList: {
              value: {
                data: [],
                pagination: {
                  page: 1,
                  pageSize: 20,
                  total: 0,
                  totalPages: 0,
                },
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
  getMyEnvironmentSummary,
  getMyEnvironmentImpactHistory,
  getMyEnvironmentImpactByRental,
  listEnvironmentPolicies,
  getActiveEnvironmentPolicy,
} as const;
