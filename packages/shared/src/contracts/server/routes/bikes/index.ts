import * as mutations from "./mutations";
import * as queries from "./queries";

export * from "./mutations";
export * from "./queries";
export * from "./shared";

export const bikesRoutes = {
  ...queries,
  ...mutations,
} as const;
