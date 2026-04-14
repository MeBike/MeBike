import {
  cancelFixedSlotTemplateRoute,
  createFixedSlotTemplateRoute,
} from "./mutations";
import {
  getFixedSlotTemplateRoute,
  listFixedSlotTemplatesRoute,
} from "./queries";

export { cancelFixedSlotTemplateRoute as cancelFixedSlotTemplate } from "./mutations";
export { createFixedSlotTemplateRoute as createFixedSlotTemplate } from "./mutations";
export { getFixedSlotTemplateRoute as getFixedSlotTemplate } from "./queries";
export { listFixedSlotTemplatesRoute as listFixedSlotTemplates } from "./queries";

export const fixedSlotTemplatesRoutes = {
  cancelFixedSlotTemplate: cancelFixedSlotTemplateRoute,
  createFixedSlotTemplate: createFixedSlotTemplateRoute,
  getFixedSlotTemplate: getFixedSlotTemplateRoute,
  listFixedSlotTemplates: listFixedSlotTemplatesRoute,
} as const;
