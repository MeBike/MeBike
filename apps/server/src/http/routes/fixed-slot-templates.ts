import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { FixedSlotTemplateMeController } from "@/http/controllers/fixed-slot-templates";
import { requireAuthMiddleware } from "@/http/middlewares/auth";

/**
 * Đăng ký toàn bộ route HTTP cho feature fixed-slot template.
 *
 * @param app OpenAPIHono app dang duoc bootstrap.
 */
export function registerFixedSlotTemplateRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const fixedSlotTemplates = serverRoutes.fixedSlotTemplates;

  const removeFixedSlotTemplateDateRoute = {
    ...fixedSlotTemplates.removeFixedSlotTemplateDate,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const getFixedSlotTemplateRoute = {
    ...fixedSlotTemplates.getFixedSlotTemplate,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const createFixedSlotTemplateRoute = {
    ...fixedSlotTemplates.createFixedSlotTemplate,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const cancelFixedSlotTemplateRoute = {
    ...fixedSlotTemplates.cancelFixedSlotTemplate,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const updateFixedSlotTemplateRoute = {
    ...fixedSlotTemplates.updateFixedSlotTemplate,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const listFixedSlotTemplatesRoute = {
    ...fixedSlotTemplates.listFixedSlotTemplates,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(removeFixedSlotTemplateDateRoute, FixedSlotTemplateMeController.removeFixedSlotTemplateDate);
  app.openapi(getFixedSlotTemplateRoute, FixedSlotTemplateMeController.getFixedSlotTemplate);
  app.openapi(createFixedSlotTemplateRoute, FixedSlotTemplateMeController.createFixedSlotTemplate);
  app.openapi(cancelFixedSlotTemplateRoute, FixedSlotTemplateMeController.cancelFixedSlotTemplate);
  app.openapi(updateFixedSlotTemplateRoute, FixedSlotTemplateMeController.updateFixedSlotTemplate);
  app.openapi(listFixedSlotTemplatesRoute, FixedSlotTemplateMeController.listFixedSlotTemplates);
}
