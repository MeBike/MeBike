import { serverRoutes } from "@mebike/shared";

import {
  SupplierAdminController,
  SupplierStatsController,
} from "@/http/controllers/suppliers";

export function registerSupplierRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const suppliers = serverRoutes.suppliers;

  app.openapi(suppliers.listSuppliers, SupplierAdminController.listSuppliers);
  app.openapi(suppliers.getSupplier, SupplierAdminController.getSupplier);
  app.openapi(suppliers.createSupplier, SupplierAdminController.createSupplier);
  app.openapi(suppliers.updateSupplier, SupplierAdminController.updateSupplier);
  app.openapi(suppliers.updateSupplierStatus, SupplierAdminController.updateSupplierStatus);
  app.openapi(suppliers.deleteSupplier, SupplierAdminController.deleteSupplier);

  app.openapi(suppliers.getAllSupplierStats, SupplierStatsController.getAllSupplierStats);
  app.openapi(suppliers.getSupplierStats, SupplierStatsController.getSupplierStats);
}
