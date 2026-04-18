import * as mutations from "./mutations";
import * as queries from "./queries";

export {
  createEnvironmentPolicy,
  activateEnvironmentPolicy,
  calculateEnvironmentImpactFromRental,
} from "./mutations";

export {
  getMyEnvironmentSummary,
  getMyEnvironmentImpactHistory,
  getMyEnvironmentImpactByRental,
  listAdminEnvironmentImpacts,
  getAdminEnvironmentImpactDetail,
  getAdminEnvironmentUserSummary,
  listEnvironmentPolicies,
  getActiveEnvironmentPolicy,
} from "./queries";

export {
  EnvironmentErrorCodeSchema,
  environmentErrorMessages,
} from "./shared";

export const environmentRoutes = {
  ...mutations,
  ...queries,
} as const;
