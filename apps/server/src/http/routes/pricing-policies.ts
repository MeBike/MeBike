import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { PricingPoliciesAdminController } from "@/http/controllers/pricing-policies";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerPricingPolicyRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const pricingPolicies = serverRoutes.pricingPolicies;
  const adminListRoute = {
    ...pricingPolicies.adminList,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminCreateRoute = {
    ...pricingPolicies.adminCreate,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminGetActiveRoute = {
    ...pricingPolicies.adminGetActive,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminGetRoute = {
    ...pricingPolicies.adminGet,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminUpdateRoute = {
    ...pricingPolicies.adminUpdate,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminActivateRoute = {
    ...pricingPolicies.adminActivate,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminListRoute, PricingPoliciesAdminController.adminListPricingPolicies);
  app.openapi(adminCreateRoute, PricingPoliciesAdminController.adminCreatePricingPolicy);
  app.openapi(adminGetActiveRoute, PricingPoliciesAdminController.adminGetActivePricingPolicy);
  app.openapi(adminGetRoute, PricingPoliciesAdminController.adminGetPricingPolicy);
  app.openapi(adminUpdateRoute, PricingPoliciesAdminController.adminUpdatePricingPolicy);
  app.openapi(adminActivateRoute, PricingPoliciesAdminController.adminActivatePricingPolicy);
}
