import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  CouponRulesAdminController,
  CouponRulesPublicController,
} from "@/http/controllers/coupons";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerCouponRuleRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const couponRules = serverRoutes.couponRules;
  const adminCreateCouponRuleRoute = {
    ...couponRules.adminCreateCouponRule,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminUpdateCouponRuleRoute = {
    ...couponRules.adminUpdateCouponRule,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminListCouponRulesRoute = {
    ...couponRules.adminListCouponRules,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    couponRules.listActiveCouponRules,
    CouponRulesPublicController.listActiveCouponRules,
  );
  app.openapi(
    adminCreateCouponRuleRoute,
    CouponRulesAdminController.adminCreateCouponRule,
  );
  app.openapi(
    adminUpdateCouponRuleRoute,
    CouponRulesAdminController.adminUpdateCouponRule,
  );
  app.openapi(
    adminListCouponRulesRoute,
    CouponRulesAdminController.adminListCouponRules,
  );
}
