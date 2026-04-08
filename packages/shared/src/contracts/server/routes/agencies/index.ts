import {
  adminUpdateAgencyRoute,
  adminUpdateAgencyStatusRoute,
} from "./mutations";
import { adminGetAgencyRoute, adminListAgenciesRoute } from "./queries";

export * from "./mutations";
export * from "./queries";
export * from "./shared";

export const agenciesRoutes = {
  adminGet: adminGetAgencyRoute,
  adminList: adminListAgenciesRoute,
  adminUpdate: adminUpdateAgencyRoute,
  adminUpdateStatus: adminUpdateAgencyStatusRoute,
} as const;
