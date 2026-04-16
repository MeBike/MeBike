import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { CouponMeController } from "@/http/controllers/coupons";
import { requireUserMiddleware } from "@/http/middlewares/auth";

export function registerCouponRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const coupons = serverRoutes.coupons;
  const getCouponRoute = {
    ...coupons.getCoupon,
    middleware: [requireUserMiddleware] as const,
  } satisfies RouteConfig;
  const listCouponsRoute = {
    ...coupons.listCoupons,
    middleware: [requireUserMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(getCouponRoute, CouponMeController.getCoupon);
  app.openapi(listCouponsRoute, CouponMeController.listCoupons);
}
