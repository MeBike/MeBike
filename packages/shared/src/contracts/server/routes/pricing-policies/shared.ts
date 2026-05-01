import { z } from "../../../../zod";
import {
  PricingPolicyDetailSchema,
  PricingPolicyErrorCodeSchema,
  pricingPolicyErrorMessages,
  PricingPolicyErrorResponseSchema,
  PricingPolicyListResponseSchema,
  PricingPolicySchema,
} from "../../pricing-policies";
import {
  ServerErrorResponseSchema,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";
import { AccountStatusSchema } from "../../users";

export {
  PricingPolicyDetailSchema,
  PricingPolicyErrorCodeSchema,
  pricingPolicyErrorMessages,
  PricingPolicyErrorResponseSchema,
  PricingPolicyListResponseSchema,
  PricingPolicySchema,
  ServerErrorResponseSchema,
  UnauthorizedErrorResponseSchema,
};

const MoneyAmountSchema = z.number().int().openapi({
  description: "Integer amount in VND. Business bounds are validated by the pricing policy service.",
});

const BillingUnitMinutesSchema = z.number().int().openapi({
  description: "Charging interval in minutes. Business bounds are validated by the pricing policy service.",
  example: 30,
});

const LateReturnCutoffInputSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).openapi({
  description: "Late return cutoff in Vietnam local time. Accepts HH:MM or HH:MM:SS input.",
  examples: ["23:00", "23:00:00"],
});

export const PricingPolicyIdParamSchema = z.object({
  pricingPolicyId: z.uuidv7(),
}).openapi("PricingPolicyIdParam");

export const ListPricingPoliciesQuerySchema = z.object({
  status: AccountStatusSchema.optional().openapi({
    description: "Optional filter by pricing policy status.",
    example: "ACTIVE",
  }),
}).openapi("ListPricingPoliciesQuery");

export const CreatePricingPolicyBodySchema = z.object({
  name: z.string().trim().min(1).openapi({
    description: "Draft pricing policy name.",
    example: "Weekend Pricing Draft",
  }),
  base_rate: MoneyAmountSchema.openapi({
    description: "Integer VND charged per billing unit.",
    example: 3000,
  }),
  billing_unit_minutes: BillingUnitMinutesSchema,
  reservation_fee: MoneyAmountSchema.openapi({
    description: "Integer VND prepaid to place a reservation.",
    example: 2000,
  }),
  deposit_required: MoneyAmountSchema.openapi({
    description: "Integer VND deposit hold required before rental use.",
    example: 500000,
  }),
  late_return_cutoff: LateReturnCutoffInputSchema,
}).openapi("CreatePricingPolicyBody", {
  description: "Create an inactive pricing policy draft. Draft creation is allowed at any time.",
  example: {
    name: "Weekend Pricing Draft",
    base_rate: 3000,
    billing_unit_minutes: 30,
    reservation_fee: 2000,
    deposit_required: 500000,
    late_return_cutoff: "23:00:00",
  },
});

export const UpdatePricingPolicyBodySchema = z.object({
  name: z.string().trim().min(1).optional().openapi({
    description: "Updated pricing policy name.",
  }),
  base_rate: MoneyAmountSchema.optional().openapi({
    description: "Updated integer VND charged per billing unit.",
  }),
  billing_unit_minutes: BillingUnitMinutesSchema.optional(),
  reservation_fee: MoneyAmountSchema.optional().openapi({
    description: "Updated integer VND prepaid to place a reservation.",
  }),
  deposit_required: MoneyAmountSchema.optional().openapi({
    description: "Updated integer VND deposit hold required before rental use.",
  }),
  late_return_cutoff: LateReturnCutoffInputSchema.optional(),
}).refine(
  value => Object.values(value).some(entry => entry !== undefined),
  {
    message: "At least one field must be provided",
  },
).openapi("UpdatePricingPolicyBody", {
  description: "Update an existing pricing policy before it has been referenced by reservations, rentals, or billing records.",
  example: {
    name: "Weekend Pricing Draft v2",
    base_rate: 3200,
  },
});

export type CreatePricingPolicyBody = z.infer<typeof CreatePricingPolicyBodySchema>;
export type UpdatePricingPolicyBody = z.infer<typeof UpdatePricingPolicyBodySchema>;
export type ListPricingPoliciesQuery = z.infer<typeof ListPricingPoliciesQuerySchema>;
