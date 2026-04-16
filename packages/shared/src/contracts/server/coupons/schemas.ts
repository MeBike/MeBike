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
  UserCouponListItemSchema,
} from "./models";

export const ListCouponsQuerySchema = z.object({
  ...paginationQueryFields,
  status: CouponStatusSchema.optional(),
}).openapi("ListCouponsQuery");

export const ListCouponsResponseSchema = z.object({
  data: UserCouponListItemSchema.array(),
  pagination: PaginationSchema,
}).openapi("ListCouponsResponse");

export type ListCouponsQuery = z.infer<typeof ListCouponsQuerySchema>;
export type ListCouponsResponse = z.infer<typeof ListCouponsResponseSchema>;

export {
  CouponDiscountTypeSchema,
  CouponStatusSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
  UserCouponListItemSchema,
};
