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
  const getMyEnvironmentImpactHistoryRoute = {
    ...environment.getMyEnvironmentImpactHistory,
    middleware: [requireUserMiddleware] as const,
  } satisfies RouteConfig;
  const getMyEnvironmentImpactByRentalRoute = {
    ...environment.getMyEnvironmentImpactByRental,
    middleware: [requireUserMiddleware] as const,
  } satisfies RouteConfig;
  const listAdminEnvironmentImpactsRoute = {
    ...environment.listAdminEnvironmentImpacts,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const getAdminEnvironmentImpactDetailRoute = {
    ...environment.getAdminEnvironmentImpactDetail,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const getAdminEnvironmentUserSummaryRoute = {
    ...environment.getAdminEnvironmentUserSummary,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const calculateImpactFromRentalRoute = {
    ...environment.calculateEnvironmentImpactFromRental,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(
    getMyEnvironmentSummaryRoute,
    EnvironmentImpactController.getMySummary,
  );
  app.openapi(
    getMyEnvironmentImpactHistoryRoute,
    EnvironmentImpactController.getMyHistory,
  );
  app.openapi(
    getMyEnvironmentImpactByRentalRoute,
    EnvironmentImpactController.getMyRentalImpact,
  );
  app.openapi(
    getAdminEnvironmentUserSummaryRoute,
    EnvironmentImpactController.getAdminUserSummary,
  );
  app.openapi(
    listAdminEnvironmentImpactsRoute,
    EnvironmentImpactController.listAdminImpacts,
  );
  app.openapi(
    getAdminEnvironmentImpactDetailRoute,
    EnvironmentImpactController.getAdminImpactDetail,
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
