import * as mutations from "./mutations";
import * as queries from "./queries";

export {
  createEnvironmentPolicy,
} from "./mutations";

export {
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
