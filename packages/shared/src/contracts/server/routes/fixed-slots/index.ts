import {
  cancelFixedSlotTemplateRoute,
  createFixedSlotTemplateRoute,
  removeFixedSlotTemplateDateRoute,
  updateFixedSlotTemplateRoute,
} from "./mutations";
import {
  getFixedSlotTemplateRoute,
  listFixedSlotTemplatesRoute,
} from "./queries";

export { cancelFixedSlotTemplateRoute as cancelFixedSlotTemplate } from "./mutations";
export { createFixedSlotTemplateRoute as createFixedSlotTemplate } from "./mutations";
export { removeFixedSlotTemplateDateRoute as removeFixedSlotTemplateDate } from "./mutations";
export { updateFixedSlotTemplateRoute as updateFixedSlotTemplate } from "./mutations";
export { getFixedSlotTemplateRoute as getFixedSlotTemplate } from "./queries";
export { listFixedSlotTemplatesRoute as listFixedSlotTemplates } from "./queries";

/** Gom toàn bộ route contract của fixed-slot template để server đăng ký tập trung. */
export const fixedSlotTemplatesRoutes = {
  cancelFixedSlotTemplate: cancelFixedSlotTemplateRoute,
  createFixedSlotTemplate: createFixedSlotTemplateRoute,
  getFixedSlotTemplate: getFixedSlotTemplateRoute,
  listFixedSlotTemplates: listFixedSlotTemplatesRoute,
  removeFixedSlotTemplateDate: removeFixedSlotTemplateDateRoute,
  updateFixedSlotTemplate: updateFixedSlotTemplateRoute,
} as const;
