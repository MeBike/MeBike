import * as queries from "./queries";

export {
  adminListCouponRules,
  listActiveCouponRules,
} from "./queries";

export const couponRulesRoutes = {
  ...queries,
} as const;
