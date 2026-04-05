import * as mutations from "./mutations";
import * as queries from "./queries";

export {
  createRedistributionRequest,
  cancelRedistributionRequest,
} from "./mutations";

export {
  getRequestListForAdmin,
  getRequestDetailForAdmin,
  getRequestListForStaff,
  getRequestDetailForStaff,
  getRequestListForManager,
  getRequestDetailForManager,
} from "./queries";

export const redistributionRoutes = {
  ...mutations,
  ...queries,
} as const;
