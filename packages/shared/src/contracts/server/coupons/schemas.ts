import { z } from "../../../zod";
import {
  paginationQueryFields,
  PaginationSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../schemas";
import {
  CouponDiscountTypeSchema,
  CouponStatusSchema,
  CouponTriggerTypeSchema,
  UserCouponConditionsSchema,
  UserCouponDetailCouponSchema,
  UserCouponDetailSchema,
  UserCouponListItemSchema,
  UserCouponRuleDetailSchema,
} from "./models";

export const CouponErrorCodeSchema = z
  .enum(["COUPON_NOT_FOUND"])
  .openapi("CouponErrorCode");

export const couponErrorMessages = {
  COUPON_NOT_FOUND: "Coupon not found",
} as const;

export const CouponErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: CouponErrorCodeSchema,
  }),
}).openapi("CouponErrorResponse");

export const ListCouponsQuerySchema = z.object({
  ...paginationQueryFields,
  status: CouponStatusSchema.optional(),
}).openapi("ListCouponsQuery");

export const CouponDetailResponseSchema = UserCouponDetailSchema.openapi("CouponDetailResponse");

export const ListCouponsResponseSchema = z.object({
  data: UserCouponListItemSchema.array(),
  pagination: PaginationSchema,
}).openapi("ListCouponsResponse");

export type CouponErrorResponse = z.infer<typeof CouponErrorResponseSchema>;
export type ListCouponsQuery = z.infer<typeof ListCouponsQuerySchema>;
export type CouponDetailResponse = z.infer<typeof CouponDetailResponseSchema>;
export type ListCouponsResponse = z.infer<typeof ListCouponsResponseSchema>;

export {
  CouponDiscountTypeSchema,
  CouponStatusSchema,
  CouponTriggerTypeSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
  UserCouponConditionsSchema,
  UserCouponDetailCouponSchema,
  UserCouponDetailSchema,
  UserCouponListItemSchema,
  UserCouponRuleDetailSchema,
};
