import { listCouponsRoute } from "./queries";

export * from "../../coupons/schemas";
export * from "./queries";

export const couponsRoutes = {
  listCoupons: listCouponsRoute,
} as const;
