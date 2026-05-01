import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  SupplierAdminController,
  SupplierStatsController,
} from "@/http/controllers/suppliers";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerSupplierRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const suppliers = serverRoutes.suppliers;

  const listSuppliersRoute = {
    ...suppliers.listSuppliers,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const createSupplierRoute = {
    ...suppliers.createSupplier,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const getAllSupplierStatsRoute = {
    ...suppliers.getAllSupplierStats,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const getSupplierStatsSummaryRoute = {
    ...suppliers.getSupplierStatsSummary,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const getSupplierRoute = {
    ...suppliers.getSupplier,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const getSupplierStatsRoute = {
    ...suppliers.getSupplierStats,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const updateSupplierRoute = {
    ...suppliers.updateSupplier,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const updateSupplierStatusRoute = {
    ...suppliers.updateSupplierStatus,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const deleteSupplierRoute = {
    ...suppliers.deleteSupplier,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(listSuppliersRoute, SupplierAdminController.listSuppliers);
  app.openapi(createSupplierRoute, SupplierAdminController.createSupplier);
  app.openapi(getAllSupplierStatsRoute, SupplierStatsController.getAllSupplierStats);
  app.openapi(getSupplierStatsSummaryRoute, SupplierStatsController.getSupplierStatsSummary);
  app.openapi(getSupplierRoute, SupplierAdminController.getSupplier);
  app.openapi(getSupplierStatsRoute, SupplierStatsController.getSupplierStats);
  app.openapi(updateSupplierRoute, SupplierAdminController.updateSupplier);
  app.openapi(updateSupplierStatusRoute, SupplierAdminController.updateSupplierStatus);
  app.openapi(deleteSupplierRoute, SupplierAdminController.deleteSupplier);
}
