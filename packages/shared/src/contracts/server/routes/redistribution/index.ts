import * as mutations from "./mutations";
import * as queries from "./queries";

export {
  createRedistributionRequest
} from "./mutations";

export {
  getRequestListForAdmin,
  getRequestDetailForAdmin,
  getRequestListForStaff,
  getRequestDetailForStaff,
  getMyRequestList,
  getMyRequestDetail
} from "./queries";

export const redistributionRoutes = {
  ...mutations,
  ...queries,
} as const;
