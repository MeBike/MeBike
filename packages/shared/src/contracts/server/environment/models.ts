import { z } from "../../../zod";
import { PaginationSchema } from "../schemas";
import { AccountStatusSchema } from "../users";

export const EnvironmentFormulaVersionSchema = z.enum(["PHASE_1_TIME_SPEED"]);
export const EnvironmentDistanceSourceSchema = z.enum(["TIME_SPEED"]);

export const EnvironmentPolicyFormulaConfigSchema = z.object({
  return_scan_buffer_minutes: z.number().int().min(0).max(30),
  confidence_factor: z.number().positive().max(1),
  display_unit: z.literal("gCO2e"),
  formula_version: EnvironmentFormulaVersionSchema,
  distance_source: EnvironmentDistanceSourceSchema,
}).openapi("EnvironmentPolicyFormulaConfig", {
  description: "Formula configuration used later by rental environment impact calculation.",
  example: {
    return_scan_buffer_minutes: 3,
    confidence_factor: 0.85,
    display_unit: "gCO2e",
    formula_version: "PHASE_1_TIME_SPEED",
    distance_source: "TIME_SPEED",
  },
});

export const EnvironmentPolicySchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  average_speed_kmh: z.number(),
  co2_saved_per_km: z.number(),
  co2_saved_per_km_unit: z.literal("gCO2e/km"),
  status: AccountStatusSchema,
  active_from: z.string().datetime().nullable(),
  active_to: z.string().datetime().nullable(),
  formula_config: EnvironmentPolicyFormulaConfigSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}).openapi("EnvironmentPolicy", {
  description: "Environment policy/config used for later CO2 saved calculation.",
  example: {
    id: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
    name: "Default Environment Policy v1",
    average_speed_kmh: 12,
    co2_saved_per_km: 75,
    co2_saved_per_km_unit: "gCO2e/km",
    status: "INACTIVE",
    active_from: null,
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
});

export const EnvironmentPolicyListResponseSchema = z.object({
  data: EnvironmentPolicySchema.array(),
  pagination: PaginationSchema,
}).openapi("EnvironmentPolicyListResponse", {
  description: "Paginated Environment Policy listing for admin config/history screens.",
  example: {
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
});

export const EnvironmentImpactPolicySnapshotSchema = z.object({
  policy_id: z.uuid(),
  policy_name: z.string(),
  average_speed_kmh: z.number(),
  co2_saved_per_km: z.number(),
  co2_saved_per_km_unit: z.literal("gCO2e/km"),
  return_scan_buffer_minutes: z.number().int().min(0),
  confidence_factor: z.number().min(0).max(1),
  raw_rental_minutes: z.number().int().min(0),
  effective_ride_minutes: z.number().int().min(0),
  estimated_distance_km: z.number(),
  co2_saved: z.number(),
  co2_saved_unit: z.literal("gCO2e"),
  distance_source: EnvironmentDistanceSourceSchema,
  formula_version: EnvironmentFormulaVersionSchema,
  formula: z.string().optional(),
}).openapi("EnvironmentImpactPolicySnapshot", {
  description: "Immutable policy and formula inputs captured when a rental impact is calculated.",
  example: {
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
    formula:
      "co2_saved = round(estimated_distance_km * co2_saved_per_km * confidence_factor)",
  },
});

export const EnvironmentImpactSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  rental_id: z.uuid(),
  policy_id: z.uuid(),
  estimated_distance_km: z.number(),
  co2_saved: z.number(),
  co2_saved_unit: z.literal("gCO2e"),
  policy_snapshot: EnvironmentImpactPolicySnapshotSchema,
  calculated_at: z.string().datetime(),
  already_calculated: z.boolean(),
}).openapi("EnvironmentImpact", {
  description: "Environment Impact stat for a completed rental.",
  example: {
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
});

export const EnvironmentImpactDetailSchema = z.object({
  id: z.uuid(),
  rental_id: z.uuid(),
  policy_id: z.uuid(),
  estimated_distance_km: z.number(),
  co2_saved: z.number(),
  co2_saved_unit: z.literal("gCO2e"),
  raw_rental_minutes: z.number().int().nonnegative().nullable(),
  effective_ride_minutes: z.number().int().nonnegative().nullable(),
  return_scan_buffer_minutes: z.number().int().nonnegative().nullable(),
  average_speed_kmh: z.number().nullable(),
  co2_saved_per_km: z.number().nullable(),
  co2_saved_per_km_unit: z.literal("gCO2e/km").nullable(),
  confidence_factor: z.number().min(0).max(1).nullable(),
  distance_source: EnvironmentDistanceSourceSchema.nullable(),
  formula_version: EnvironmentFormulaVersionSchema.nullable(),
  policy_snapshot: EnvironmentImpactPolicySnapshotSchema,
  calculated_at: z.string().datetime(),
}).openapi("EnvironmentImpactDetail", {
  description:
    "Detailed calculated Environment Impact record for one authenticated user's rental. Reads only environmental_impact_stats.",
  example: {
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
});

export const EnvironmentImpactHistoryItemSchema = z.object({
  id: z.uuid(),
  rental_id: z.uuid(),
  policy_id: z.uuid(),
  estimated_distance_km: z.number(),
  co2_saved: z.number(),
  co2_saved_unit: z.literal("gCO2e"),
  distance_source: EnvironmentDistanceSourceSchema.nullable(),
  raw_rental_minutes: z.number().int().nonnegative().nullable(),
  effective_ride_minutes: z.number().int().nonnegative().nullable(),
  calculated_at: z.string().datetime(),
}).openapi("EnvironmentImpactHistoryItem", {
  description:
    "One calculated Environment Impact record for the authenticated user's rental history.",
  example: {
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
});

export const EnvironmentImpactHistoryResponseSchema = z.object({
  data: EnvironmentImpactHistoryItemSchema.array(),
  pagination: PaginationSchema,
}).openapi("EnvironmentImpactHistoryResponse", {
  description:
    "Paginated calculated Environment Impact history for the authenticated user. Reads only environmental_impact_stats.",
  example: {
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
});

export const EnvironmentSummarySchema = z.object({
  total_trips_counted: z.number().int().nonnegative(),
  total_estimated_distance_km: z.number().nonnegative(),
  total_co2_saved: z.number().nonnegative(),
  co2_saved_unit: z.literal("gCO2e"),
}).openapi("EnvironmentSummary", {
  description:
    "Accumulated Environment Impact summary for the authenticated account. Values are aggregated only from environmental_impact_stats.",
  example: {
    total_trips_counted: 3,
    total_estimated_distance_km: 7.4,
    total_co2_saved: 472,
    co2_saved_unit: "gCO2e",
  },
});

export type EnvironmentPolicyFormulaConfig = z.infer<
  typeof EnvironmentPolicyFormulaConfigSchema
>;
export type EnvironmentPolicy = z.infer<typeof EnvironmentPolicySchema>;
export type EnvironmentPolicyListResponse = z.infer<
  typeof EnvironmentPolicyListResponseSchema
>;
export type EnvironmentImpactPolicySnapshot = z.infer<
  typeof EnvironmentImpactPolicySnapshotSchema
>;
export type EnvironmentImpact = z.infer<typeof EnvironmentImpactSchema>;
export type EnvironmentImpactDetail = z.infer<
  typeof EnvironmentImpactDetailSchema
>;
export type EnvironmentImpactHistoryItem = z.infer<
  typeof EnvironmentImpactHistoryItemSchema
>;
export type EnvironmentImpactHistoryResponse = z.infer<
  typeof EnvironmentImpactHistoryResponseSchema
>;
export type EnvironmentSummary = z.infer<typeof EnvironmentSummarySchema>;
