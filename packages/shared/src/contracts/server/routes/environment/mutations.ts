import { createRoute } from "@hono/zod-openapi";

import {
  CreateEnvironmentPolicyBodySchema,
  EnvironmentErrorCodeSchema,
  environmentErrorMessages,
  EnvironmentImpactRentalIdParamsSchema,
  EnvironmentImpactSchema,
  EnvironmentPolicyIdParamsSchema,
  EnvironmentPolicySchema,
  ServerErrorResponseSchema,
  UnauthorizedErrorResponseSchema,
} from "./shared";

export const createEnvironmentPolicy = createRoute({
  method: "post",
  path: "/v1/environment/policies",
  tags: ["Environment"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: CreateEnvironmentPolicyBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: "Environment policy created as an inactive draft",
      content: {
        "application/json": { schema: EnvironmentPolicySchema },
      },
    },
    400: {
      description: "Invalid request payload",
      content: {
        "application/json": { schema: ServerErrorResponseSchema },
      },
    },
    401: {
      description: "Authentication is required",
      content: {
        "application/json": { schema: UnauthorizedErrorResponseSchema },
      },
    },
    403: {
      description: "Admin role is required",
      content: {
        "application/json": { schema: UnauthorizedErrorResponseSchema },
      },
    },
  },
});

export const activateEnvironmentPolicy = createRoute({
  method: "patch",
  path: "/v1/environment/policies/{policyId}/activate",
  tags: ["Environment"],
  security: [{ bearerAuth: [] }],
  request: {
    params: EnvironmentPolicyIdParamsSchema,
  },
  responses: {
    200: {
      description: "Activate an Environment Policy and make it the single active Phase 1 CO2 saved formula",
      content: {
        "application/json": {
          schema: EnvironmentPolicySchema,
          examples: {
            ActivatedEnvironmentPolicy: {
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
    400: {
      description: "Invalid path parameter",
      content: {
        "application/json": { schema: ServerErrorResponseSchema },
      },
    },
    401: {
      description: "Authentication is required",
      content: {
        "application/json": { schema: UnauthorizedErrorResponseSchema },
      },
    },
    403: {
      description: "Admin role is required",
      content: {
        "application/json": { schema: UnauthorizedErrorResponseSchema },
      },
    },
    404: {
      description: "Environment policy not found",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
          examples: {
            EnvironmentPolicyNotFound: {
              value: {
                error: environmentErrorMessages.ENVIRONMENT_POLICY_NOT_FOUND,
                details: {
                  code: EnvironmentErrorCodeSchema.enum.ENVIRONMENT_POLICY_NOT_FOUND,
                },
              },
            },
          },
        },
      },
    },
    409: {
      description: "Environment policy cannot be activated",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
          examples: {
            EnvironmentPolicyActivationBlocked: {
              value: {
                error: environmentErrorMessages.ENVIRONMENT_POLICY_ACTIVATION_BLOCKED,
                details: {
                  code: EnvironmentErrorCodeSchema.enum.ENVIRONMENT_POLICY_ACTIVATION_BLOCKED,
                },
              },
            },
          },
        },
      },
    },
  },
});

export const calculateEnvironmentImpactFromRental = createRoute({
  method: "post",
  path: "/v1/internal/environment/calculate-from-rental/{rentalId}",
  tags: ["Environment"],
  security: [{ bearerAuth: [] }],
  request: {
    params: EnvironmentImpactRentalIdParamsSchema,
  },
  responses: {
    200: {
      description:
        "Internal worker/admin Phase 1 endpoint: calculate Environment Impact for one completed rental. Idempotent by rentalId.",
      content: {
        "application/json": {
          schema: EnvironmentImpactSchema,
          examples: {
            CalculatedEnvironmentImpact: {
              value: {
                id: "018fa0f9-8f3b-752c-8f3d-2c9000000001",
                user_id: "018fa0f9-8f3b-752c-8f3d-2c9000000002",
                rental_id: "018fa0f9-8f3b-752c-8f3d-2c9000000003",
                policy_id: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
                estimated_distance_km: 4,
                co2_saved: 255,
                co2_saved_unit: "gCO2e",
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
                calculated_at: "2026-04-15T01:00:00.000Z",
                already_calculated: false,
              },
            },
            AlreadyCalculatedEnvironmentImpact: {
              value: {
                id: "018fa0f9-8f3b-752c-8f3d-2c9000000001",
                user_id: "018fa0f9-8f3b-752c-8f3d-2c9000000002",
                rental_id: "018fa0f9-8f3b-752c-8f3d-2c9000000003",
                policy_id: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
                estimated_distance_km: 4,
                co2_saved: 255,
                co2_saved_unit: "gCO2e",
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
                calculated_at: "2026-04-15T01:00:00.000Z",
                already_calculated: true,
              },
            },
          },
        },
      },
    },
    400: {
      description: "Invalid rentalId path parameter",
      content: {
        "application/json": { schema: ServerErrorResponseSchema },
      },
    },
    401: {
      description: "Authentication is required",
      content: {
        "application/json": { schema: UnauthorizedErrorResponseSchema },
      },
    },
    403: {
      description:
        "Admin role is required temporarily because no internal API key middleware exists yet",
      content: {
        "application/json": { schema: UnauthorizedErrorResponseSchema },
      },
    },
    404: {
      description: "Rental or active environment policy not found",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
          examples: {
            RentalNotFound: {
              value: {
                error: environmentErrorMessages.ENVIRONMENT_IMPACT_RENTAL_NOT_FOUND,
                details: {
                  code: EnvironmentErrorCodeSchema.enum.ENVIRONMENT_IMPACT_RENTAL_NOT_FOUND,
                },
              },
            },
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
    409: {
      description: "Rental is not completed yet",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
          examples: {
            RentalNotCompleted: {
              value: {
                error: environmentErrorMessages.ENVIRONMENT_IMPACT_RENTAL_NOT_COMPLETED,
                details: {
                  code: EnvironmentErrorCodeSchema.enum.ENVIRONMENT_IMPACT_RENTAL_NOT_COMPLETED,
                },
              },
            },
          },
        },
      },
    },
  },
});

export const environmentMutations = {
  createEnvironmentPolicy,
  activateEnvironmentPolicy,
  calculateEnvironmentImpactFromRental,
} as const;
