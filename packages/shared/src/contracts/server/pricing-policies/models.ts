import { z } from "../../../zod";
import { AccountStatusSchema } from "../users";

export const PricingPolicyTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).openapi(
  "PricingPolicyTime",
  {
    description: "Wall-clock time stored by pricing policy in HH:MM:SS format.",
    example: "23:00:00",
  },
);

export const PricingPolicySchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  base_rate: z.number().int().nonnegative(),
  billing_unit_minutes: z.number().int().positive(),
  reservation_fee: z.number().int().nonnegative(),
  deposit_required: z.number().int().nonnegative(),
  late_return_cutoff: PricingPolicyTimeSchema,
  status: AccountStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}).openapi("PricingPolicy", {
  description: "Pricing policy draft or active configuration used for reservations and rentals.",
  example: {
    id: "0195c768-3456-7f01-8234-111111111111",
    name: "Default Pricing Policy",
    base_rate: 2000,
    billing_unit_minutes: 30,
    reservation_fee: 2000,
    deposit_required: 500000,
    late_return_cutoff: "23:00:00",
    status: "ACTIVE",
    created_at: "2026-04-20T16:00:00.000Z",
    updated_at: "2026-04-20T16:00:00.000Z",
  },
});

export const PricingPolicyUsageSummarySchema = z.object({
  reservation_count: z.number().int().nonnegative(),
  rental_count: z.number().int().nonnegative(),
  billing_record_count: z.number().int().nonnegative(),
  is_used: z.boolean(),
}).openapi("PricingPolicyUsageSummary", {
  description: "Reference summary used to decide whether a pricing policy is still editable.",
  example: {
    reservation_count: 1,
    rental_count: 0,
    billing_record_count: 0,
    is_used: true,
  },
});

export const PricingPolicyDetailSchema = PricingPolicySchema.extend({
  usage_summary: PricingPolicyUsageSummarySchema,
}).openapi("PricingPolicyDetail", {
  description: "Detailed pricing policy response including historical usage lock information.",
  example: {
    id: "0195c768-3456-7f01-8234-111111111111",
    name: "Default Pricing Policy",
    base_rate: 2000,
    billing_unit_minutes: 30,
    reservation_fee: 2000,
    deposit_required: 500000,
    late_return_cutoff: "23:00:00",
    status: "ACTIVE",
    created_at: "2026-04-20T16:00:00.000Z",
    updated_at: "2026-04-20T16:00:00.000Z",
    usage_summary: {
      reservation_count: 1,
      rental_count: 0,
      billing_record_count: 0,
      is_used: true,
    },
  },
});

export const PricingPolicyListResponseSchema = z.object({
  data: z.array(PricingPolicySchema),
}).openapi("PricingPolicyListResponse", {
  description: "Admin list of pricing policies.",
  example: {
    data: [
      {
        id: "0195c768-3456-7f01-8234-111111111111",
        name: "Default Pricing Policy",
        base_rate: 2000,
        billing_unit_minutes: 30,
        reservation_fee: 2000,
        deposit_required: 500000,
        late_return_cutoff: "23:00:00",
        status: "ACTIVE",
        created_at: "2026-04-20T16:00:00.000Z",
        updated_at: "2026-04-20T16:00:00.000Z",
      },
    ],
  },
});

export type PricingPolicy = z.infer<typeof PricingPolicySchema>;
export type PricingPolicyDetail = z.infer<typeof PricingPolicyDetailSchema>;
export type PricingPolicyUsageSummary = z.infer<typeof PricingPolicyUsageSummarySchema>;
export type PricingPolicyListResponse = z.infer<typeof PricingPolicyListResponseSchema>;
