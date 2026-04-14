import { createFixedSlotTemplateRoute } from "./mutations";
import { listFixedSlotTemplatesRoute } from "./queries";

export { createFixedSlotTemplateRoute as createFixedSlotTemplate } from "./mutations";
export { listFixedSlotTemplatesRoute as listFixedSlotTemplates } from "./queries";

export const fixedSlotTemplatesRoutes = {
  createFixedSlotTemplate: createFixedSlotTemplateRoute,
  listFixedSlotTemplates: listFixedSlotTemplatesRoute,
} as const;
