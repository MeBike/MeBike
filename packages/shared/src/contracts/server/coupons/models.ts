import { z } from "../../../zod";

export const CouponStatusSchema = z
  .enum(["ACTIVE", "ASSIGNED", "LOCKED", "USED", "EXPIRED", "CANCELLED"])
  .openapi("CouponStatus");

export const CouponDiscountTypeSchema = z
  .enum(["PERCENTAGE", "FIXED_AMOUNT"])
  .openapi("CouponDiscountType");

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

export type CouponStatus = z.infer<typeof CouponStatusSchema>;
export type CouponDiscountType = z.infer<typeof CouponDiscountTypeSchema>;
export type UserCouponListItem = z.infer<typeof UserCouponListItemSchema>;
