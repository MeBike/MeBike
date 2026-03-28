import { submitAgencyRequestRoute } from "./mutations";
import { adminListAgencyRequestsRoute } from "./queries";

export * from "./mutations";
export * from "./queries";
export * from "./shared";

export const agencyRequestsRoutes = {
  submit: submitAgencyRequestRoute,
  adminList: adminListAgencyRequestsRoute,
} as const;
