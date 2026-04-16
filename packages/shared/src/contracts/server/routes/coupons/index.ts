import { getCouponRoute, listCouponsRoute } from "./queries";

export * from "../../coupons/schemas";
export * from "./queries";

export const couponsRoutes = {
  getCoupon: getCouponRoute,
  listCoupons: listCouponsRoute,
} as const;
