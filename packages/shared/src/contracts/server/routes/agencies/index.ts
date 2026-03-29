import { adminGetAgencyRoute, adminListAgenciesRoute } from "./queries";

export * from "./queries";
export * from "./shared";

export const agenciesRoutes = {
  adminGet: adminGetAgencyRoute,
  adminList: adminListAgenciesRoute,
} as const;
