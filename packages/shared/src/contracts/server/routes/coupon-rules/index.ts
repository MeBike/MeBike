import * as queries from "./queries";

export { listActiveCouponRules } from "./queries";

export const couponRulesRoutes = {
  ...queries,
} as const;
