import { z } from "../../../zod";
import { AccountStatusSchema } from "../users/schemas";

export const CouponDiscountTypeSchema = z
  .enum(["PERCENTAGE", "FIXED_AMOUNT"])
  .openapi("CouponDiscountType");

export const CouponTriggerTypeSchema = z
  .enum([
    "RIDING_DURATION",
    "USAGE_FREQUENCY",
    "CAMPAIGN",
    "MEMBERSHIP_MILESTONE",
    "MANUAL_GRANT",
  ])
  .openapi("CouponTriggerType");

export const ActiveCouponRuleSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  triggerType: CouponTriggerTypeSchema,
  minRidingMinutes: z.number().int().nonnegative(),
  minBillableHours: z.number().nonnegative(),
  discountType: CouponDiscountTypeSchema,
  discountValue: z.number().nonnegative(),
  status: AccountStatusSchema,
  priority: z.number().int(),
  activeFrom: z.iso.datetime().nullable(),
  activeTo: z.iso.datetime().nullable(),
  displayLabel: z.string(),
}).openapi("ActiveCouponRule");

export const ActiveCouponRulesResponseSchema = z.object({
  data: z.array(ActiveCouponRuleSchema),
}).openapi("ActiveCouponRulesResponse");

export type CouponDiscountType = z.infer<typeof CouponDiscountTypeSchema>;
export type CouponTriggerType = z.infer<typeof CouponTriggerTypeSchema>;
export type ActiveCouponRule = z.infer<typeof ActiveCouponRuleSchema>;
export type ActiveCouponRulesResponse = z.infer<
  typeof ActiveCouponRulesResponseSchema
>;
