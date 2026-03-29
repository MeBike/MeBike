import { adminListAgenciesRoute } from "./queries";

export * from "./queries";
export * from "./shared";

export const agenciesRoutes = {
  adminList: adminListAgenciesRoute,
} as const;
