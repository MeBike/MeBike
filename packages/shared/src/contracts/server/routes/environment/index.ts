import * as mutations from "./mutations";

export {
  createEnvironmentPolicy,
} from "./mutations";

export const environmentRoutes = {
  ...mutations,
} as const;
