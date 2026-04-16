import * as mutations from "./mutations";
import * as queries from "./queries";

export {
  adminListCouponRules,
  listActiveCouponRules,
} from "./queries";
export {
  adminCreateCouponRule,
  adminUpdateCouponRule,
} from "./mutations";

export const couponRulesRoutes = {
  ...mutations,
  ...queries,
} as const;
