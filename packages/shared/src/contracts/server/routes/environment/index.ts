import * as mutations from "./mutations";
import * as queries from "./queries";

export {
  createEnvironmentPolicy,
  activateEnvironmentPolicy,
} from "./mutations";

export {
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
