import { z } from "../../../zod";

export const CouponDiscountTypeSchema = z
  .enum(["PERCENTAGE", "FIXED_AMOUNT"])
  .openapi("CouponDiscountType");

export const CouponTriggerTypeSchema = z
  .enum(["RIDING_DURATION", "USAGE_FREQUENCY", "CAMPAIGN", "MEMBERSHIP_MILESTONE", "MANUAL_GRANT"])
  .openapi("CouponTriggerType");

export type CouponDiscountType = z.infer<typeof CouponDiscountTypeSchema>;
export type CouponTriggerType = z.infer<typeof CouponTriggerTypeSchema>;
