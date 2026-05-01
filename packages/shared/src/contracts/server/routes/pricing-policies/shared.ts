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

const MoneyAmountSchema = z.number().int();

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
  name: z.string().trim().min(1),
  base_rate: MoneyAmountSchema,
  billing_unit_minutes: z.number().int(),
  reservation_fee: MoneyAmountSchema,
  deposit_required: MoneyAmountSchema,
  late_return_cutoff: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
}).openapi("CreatePricingPolicyBody", {
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
  name: z.string().trim().min(1).optional(),
  base_rate: MoneyAmountSchema.optional(),
  billing_unit_minutes: z.number().int().optional(),
  reservation_fee: MoneyAmountSchema.optional(),
  deposit_required: MoneyAmountSchema.optional(),
  late_return_cutoff: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).optional(),
}).refine(
  value => Object.values(value).some(entry => entry !== undefined),
  {
    message: "At least one field must be provided",
  },
).openapi("UpdatePricingPolicyBody", {
  example: {
    name: "Weekend Pricing Draft v2",
    base_rate: 3200,
  },
});

export type CreatePricingPolicyBody = z.infer<typeof CreatePricingPolicyBodySchema>;
export type UpdatePricingPolicyBody = z.infer<typeof UpdatePricingPolicyBodySchema>;
export type ListPricingPoliciesQuery = z.infer<typeof ListPricingPoliciesQuerySchema>;
