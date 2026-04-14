import { serverRoutes } from "@mebike/shared";

import { FixedSlotTemplateMeController } from "@/http/controllers/fixed-slot-templates";

export function registerFixedSlotTemplateRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const fixedSlotTemplates = serverRoutes.fixedSlotTemplates;

  app.openapi(fixedSlotTemplates.getFixedSlotTemplate, FixedSlotTemplateMeController.getFixedSlotTemplate);
  app.openapi(fixedSlotTemplates.createFixedSlotTemplate, FixedSlotTemplateMeController.createFixedSlotTemplate);
  app.openapi(fixedSlotTemplates.cancelFixedSlotTemplate, FixedSlotTemplateMeController.cancelFixedSlotTemplate);
  app.openapi(fixedSlotTemplates.listFixedSlotTemplates, FixedSlotTemplateMeController.listFixedSlotTemplates);
}
