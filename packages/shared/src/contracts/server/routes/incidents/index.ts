import { incidentsMutations } from "./mutations";
import { incidentsQueries } from "./queries";

export * from "./mutations";
export * from "./queries";
export * from "./shared";

export const incidentsRoutes = {
  ...incidentsQueries,
  ...incidentsMutations,
} as const;
