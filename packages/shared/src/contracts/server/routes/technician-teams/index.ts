import { technicianTeamMutations } from "./mutations";
import { technicianTeamQueries } from "./queries";

export * from "./mutations";
export * from "./queries";
export * from "./shared";

export const technicianTeamsRoutes = {
  ...technicianTeamQueries,
  ...technicianTeamMutations,
} as const;
