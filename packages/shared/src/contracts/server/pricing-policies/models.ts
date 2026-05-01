import { z } from "../../../zod";
import { AccountStatusSchema } from "../users";

export const PricingPolicyTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).openapi(
  "PricingPolicyTime",
  {
    description: "Late return cutoff time in Vietnam local wall-clock format. Responses always use HH:MM:SS.",
    example: "23:00:00",
  },
);

export const PricingPolicySchema = z.object({
  id: z.uuidv7(),
  name: z.string().openapi({
    description: "Human-readable pricing policy name.",
    example: "Default Pricing Policy",
  }),
  base_rate: z.number().int().nonnegative().openapi({
    description: "Integer VND charged per billing unit.",
    example: 2000,
  }),
  billing_unit_minutes: z.number().int().positive().openapi({
    description: "Length of one billing unit in minutes used to round rental duration up.",
    example: 30,
  }),
  reservation_fee: z.number().int().nonnegative().openapi({
    description: "Integer VND prepaid to create a reservation.",
    example: 2000,
  }),
  deposit_required: z.number().int().nonnegative().openapi({
    description: "Integer VND hold required before rental use.",
    example: 500000,
  }),
  late_return_cutoff: PricingPolicyTimeSchema,
  status: AccountStatusSchema,
  created_at: z.string().datetime().openapi({
    description: "Creation timestamp in ISO 8601 UTC format.",
  }),
  updated_at: z.string().datetime().openapi({
    description: "Last update timestamp in ISO 8601 UTC format.",
  }),
}).openapi("PricingPolicy", {
  description: "Pricing policy draft or active configuration used for reservation and rental pricing. Money fields are integer VND amounts.",
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
  reservation_count: z.number().int().nonnegative().openapi({
    description: "Number of reservations that reference this pricing policy.",
  }),
  rental_count: z.number().int().nonnegative().openapi({
    description: "Number of rentals that reference this pricing policy directly.",
  }),
  billing_record_count: z.number().int().nonnegative().openapi({
    description: "Number of billing records that reference this pricing policy historically.",
  }),
  is_used: z.boolean().openapi({
    description: "Whether this pricing policy is locked from further updates because it has already been referenced.",
  }),
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
