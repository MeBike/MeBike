import { z } from "../../../zod";

export const CouponStatusSchema = z
  .enum(["ACTIVE", "ASSIGNED", "LOCKED", "USED", "EXPIRED", "CANCELLED"])
  .openapi("CouponStatus");

export const CouponDiscountTypeSchema = z
  .enum(["PERCENTAGE", "FIXED_AMOUNT"])
  .openapi("CouponDiscountType");

export const CouponTriggerTypeSchema = z
  .enum(["RIDING_DURATION", "USAGE_FREQUENCY", "CAMPAIGN", "MEMBERSHIP_MILESTONE", "MANUAL_GRANT"])
  .openapi("CouponTriggerType");

export const UserCouponListItemSchema = z.object({
  userCouponId: z.uuidv7(),
  couponId: z.uuidv7(),
  code: z.string(),
  status: CouponStatusSchema,
  discountType: CouponDiscountTypeSchema,
  discountValue: z.string().openapi({ example: "1000" }),
  expiresAt: z.string().datetime().nullable(),
  assignedAt: z.string().datetime(),
  usedAt: z.string().datetime().nullable(),
  lockedAt: z.string().datetime().nullable(),
  lockExpiresAt: z.string().datetime().nullable(),
  couponRuleId: z.uuidv7().nullable(),
  couponRuleName: z.string().nullable(),
}).openapi("UserCouponListItem");

export const UserCouponRuleDetailSchema = z.object({
  id: z.uuidv7().nullable(),
  name: z.string().nullable(),
  triggerType: CouponTriggerTypeSchema.nullable(),
  minRidingMinutes: z.number().int().positive().nullable(),
  minBillableHours: z.string().nullable().openapi({ example: "2" }),
}).openapi("UserCouponRuleDetail");

export const UserCouponDetailCouponSchema = z.object({
  id: z.uuidv7(),
  code: z.string(),
  discountType: CouponDiscountTypeSchema,
  discountValue: z.string().openapi({ example: "2000" }),
  expiresAt: z.string().datetime().nullable(),
  rule: UserCouponRuleDetailSchema,
}).openapi("UserCouponDetailCoupon");

export const UserCouponConditionsSchema = z.object({
  requiresNoSubscription: z.boolean(),
  usesBillableHours: z.boolean(),
  billableMinutesPerBlock: z.number().int().positive(),
  billableHoursPerBlock: z.string().openapi({ example: "0.5" }),
  minimumBillableHours: z.string().nullable().openapi({ example: "1" }),
  appliesToPenalty: z.boolean(),
  appliesToDepositForfeited: z.boolean(),
  appliesToOtherFees: z.boolean(),
  maxCouponsPerRental: z.number().int().positive(),
}).openapi("UserCouponConditions");

export const UserCouponDetailSchema = z.object({
  userCouponId: z.uuidv7(),
  couponId: z.uuidv7(),
  couponRuleId: z.uuidv7().nullable(),
  couponRuleName: z.string().nullable(),
  code: z.string(),
  status: CouponStatusSchema,
  discountType: CouponDiscountTypeSchema,
  discountValue: z.string().openapi({ example: "2000" }),
  expiresAt: z.string().datetime().nullable(),
  assignedAt: z.string().datetime(),
  usedAt: z.string().datetime().nullable(),
  lockedAt: z.string().datetime().nullable(),
  lockExpiresAt: z.string().datetime().nullable(),
  description: z.string().nullable(),
  coupon: UserCouponDetailCouponSchema,
  conditions: UserCouponConditionsSchema,
}).openapi("UserCouponDetail");

export type CouponStatus = z.infer<typeof CouponStatusSchema>;
export type CouponDiscountType = z.infer<typeof CouponDiscountTypeSchema>;
export type CouponTriggerType = z.infer<typeof CouponTriggerTypeSchema>;
export type UserCouponListItem = z.infer<typeof UserCouponListItemSchema>;
export type UserCouponRuleDetail = z.infer<typeof UserCouponRuleDetailSchema>;
export type UserCouponDetailCoupon = z.infer<typeof UserCouponDetailCouponSchema>;
export type UserCouponConditions = z.infer<typeof UserCouponConditionsSchema>;
export type UserCouponDetail = z.infer<typeof UserCouponDetailSchema>;
