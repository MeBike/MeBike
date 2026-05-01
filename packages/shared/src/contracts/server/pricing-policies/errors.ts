import { z } from "../../../zod";

import { ServerErrorDetailSchema } from "../schemas";

export const PricingPolicyErrorCodeSchema = z.enum([
  "ACTIVE_PRICING_POLICY_AMBIGUOUS",
  "ACTIVE_PRICING_POLICY_NOT_FOUND",
  "PRICING_POLICY_ALREADY_USED",
  "PRICING_POLICY_INVALID_INPUT",
  "PRICING_POLICY_MUTATION_WINDOW_CLOSED",
  "PRICING_POLICY_NOT_FOUND",
  "VALIDATION_ERROR",
]);

export const pricingPolicyErrorMessages = {
  ACTIVE_PRICING_POLICY_AMBIGUOUS: "Multiple active pricing policies found",
  ACTIVE_PRICING_POLICY_NOT_FOUND: "No active pricing policy found",
  PRICING_POLICY_ALREADY_USED: "Pricing policy has already been used",
  PRICING_POLICY_INVALID_INPUT: "Pricing policy input is outside allowed business bounds",
  PRICING_POLICY_MUTATION_WINDOW_CLOSED: "Pricing policy activation is only allowed overnight",
  PRICING_POLICY_NOT_FOUND: "Pricing policy not found",
  VALIDATION_ERROR: "Invalid request payload",
} as const satisfies Record<z.infer<typeof PricingPolicyErrorCodeSchema>, string>;

export const PricingPolicyErrorDetailSchema = ServerErrorDetailSchema.extend({
  code: PricingPolicyErrorCodeSchema,
  pricingPolicyId: z.uuidv7().optional(),
  pricingPolicyIds: z.array(z.uuidv7()).optional(),
  reservationCount: z.number().int().nonnegative().optional(),
  rentalCount: z.number().int().nonnegative().optional(),
  billingRecordCount: z.number().int().nonnegative().optional(),
  currentTime: z.string().optional(),
  timeZone: z.string().optional(),
  windowStart: z.string().optional(),
  windowEnd: z.string().optional(),
});

export const PricingPolicyErrorResponseSchema = z.object({
  error: z.string(),
  details: PricingPolicyErrorDetailSchema,
});

export type PricingPolicyErrorResponse = z.infer<typeof PricingPolicyErrorResponseSchema>;
