import { submitAgencyRequestRoute } from "./mutations";
import { adminGetAgencyRequestRoute, adminListAgencyRequestsRoute } from "./queries";

export * from "./mutations";
export * from "./queries";
export * from "./shared";

export const agencyRequestsRoutes = {
  submit: submitAgencyRequestRoute,
  adminList: adminListAgencyRequestsRoute,
  adminGet: adminGetAgencyRequestRoute,
} as const;
