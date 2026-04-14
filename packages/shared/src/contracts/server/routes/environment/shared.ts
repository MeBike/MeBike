import { z } from "../../../../zod";
import {
  ServerErrorResponseSchema,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";
import { EnvironmentPolicySchema } from "../../environment";

export { EnvironmentPolicySchema, ServerErrorResponseSchema, UnauthorizedErrorResponseSchema };

export const CreateEnvironmentPolicyBodySchema = z.object({
  name: z.string().trim().min(1, {
    message: "name must not be empty",
  }),
  average_speed_kmh: z.number()
    .positive({ message: "average_speed_kmh must be greater than 0" })
    .max(40, { message: "average_speed_kmh must be less than or equal to 40" }),
  co2_saved_per_km: z.number()
    .min(0, { message: "co2_saved_per_km must be greater than or equal to 0" })
    .max(500, { message: "co2_saved_per_km must be less than or equal to 500" }),
  return_scan_buffer_minutes: z.number()
    .int({ message: "return_scan_buffer_minutes must be an integer" })
    .min(0, { message: "return_scan_buffer_minutes must be greater than or equal to 0" })
    .max(30, { message: "return_scan_buffer_minutes must be less than or equal to 30" })
    .optional(),
  confidence_factor: z.number()
    .positive({ message: "confidence_factor must be greater than 0" })
    .max(1, { message: "confidence_factor must be less than or equal to 1" })
    .optional(),
  status: z.literal("INACTIVE").optional(),
}).openapi("CreateEnvironmentPolicyBody", {
  description: "Create an inactive Environment Policy draft for Phase 1 CO2 saved calculation.",
  example: {
    name: "Default Environment Policy v1",
    average_speed_kmh: 12,
    co2_saved_per_km: 75,
    return_scan_buffer_minutes: 3,
    confidence_factor: 0.85,
  },
});

export type CreateEnvironmentPolicyBody = z.infer<
  typeof CreateEnvironmentPolicyBodySchema
>;
export type EnvironmentPolicyResponse = z.infer<typeof EnvironmentPolicySchema>;
export type EnvironmentErrorResponse = z.infer<typeof ServerErrorResponseSchema>;
