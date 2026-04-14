import { z } from "../../../zod";
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

export type EnvironmentPolicyFormulaConfig = z.infer<
  typeof EnvironmentPolicyFormulaConfigSchema
>;
export type EnvironmentPolicy = z.infer<typeof EnvironmentPolicySchema>;
