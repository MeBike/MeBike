import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  EnvironmentImpactController,
  EnvironmentPolicyController,
} from "@/http/controllers/environment";
import {
  requireAdminMiddleware,
  requireUserMiddleware,
} from "@/http/middlewares/auth";

export function registerEnvironmentRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const environment = serverRoutes.environment;
  const createPolicyRoute = {
    ...environment.createEnvironmentPolicy,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const listPoliciesRoute = {
    ...environment.listEnvironmentPolicies,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const getActivePolicyRoute = {
    ...environment.getActiveEnvironmentPolicy,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const activatePolicyRoute = {
    ...environment.activateEnvironmentPolicy,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const getMyEnvironmentSummaryRoute = {
    ...environment.getMyEnvironmentSummary,
    middleware: [requireUserMiddleware] as const,
  } satisfies RouteConfig;
  const calculateImpactFromRentalRoute = {
    ...environment.calculateEnvironmentImpactFromRental,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    getMyEnvironmentSummaryRoute,
    EnvironmentImpactController.getMySummary,
  );
  app.openapi(listPoliciesRoute, EnvironmentPolicyController.listPolicies);
  app.openapi(createPolicyRoute, EnvironmentPolicyController.createPolicy);
  app.openapi(getActivePolicyRoute, EnvironmentPolicyController.getActivePolicy);
  app.openapi(activatePolicyRoute, EnvironmentPolicyController.activatePolicy);
  app.openapi(
    calculateImpactFromRentalRoute,
    EnvironmentImpactController.calculateFromRental,
  );
}
