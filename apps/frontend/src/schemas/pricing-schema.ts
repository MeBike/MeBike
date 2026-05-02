import { z } from "zod";
export const createPricingPolicySchema = z.object({
  name: z.string().min(1),
  base_rate: z.number().int().nonnegative(),
  billing_unit_minutes: z.number().int().positive(),
  reservation_fee: z.number().int().nonnegative(),
  deposit_required: z.number().int().nonnegative(),
  late_return_cutoff: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Invalid time format"),
  status: z.enum(["ACTIVE", "INACTIVE"]).or(z.string()),
});
export type CreatePricingPolicyFormData = z.infer<typeof createPricingPolicySchema>;
export const updatePricingPolicySchema = z.object({
  name: z.string().min(1),
  base_rate: z.number().int().nonnegative(),
  billing_unit_minutes: z.number().int().positive(),
  reservation_fee: z.number().int().nonnegative(),
  deposit_required: z.number().int().nonnegative(),
  late_return_cutoff: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Invalid time format"),
  status: z.enum(["ACTIVE", "INACTIVE"]).or(z.string()),
});
export type UpdatePricingPolicyFormData = z.infer<typeof updatePricingPolicySchema>;