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
  const adminActivateCouponRuleRoute = {
    ...couponRules.adminActivateCouponRule,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminDeactivateCouponRuleRoute = {
    ...couponRules.adminDeactivateCouponRule,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminListCouponRulesRoute = {
    ...couponRules.adminListCouponRules,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminCouponStatsRoute = {
    ...couponRules.adminCouponStats,
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
    adminActivateCouponRuleRoute,
    CouponRulesAdminController.adminActivateCouponRule,
  );
  app.openapi(
    adminDeactivateCouponRuleRoute,
    CouponRulesAdminController.adminDeactivateCouponRule,
  );
  app.openapi(
    adminListCouponRulesRoute,
    CouponRulesAdminController.adminListCouponRules,
  );
  app.openapi(
    adminCouponStatsRoute,
    CouponRulesAdminController.adminCouponStats,
  );
}
