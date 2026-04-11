import * as mutations from "./mutations";
import * as queries from "./queries";

export {
  createRedistributionRequest,
  cancelRedistributionRequest,
  approveRedistributionRequest,
  rejectRedistributionRequest,
  startTransition,
  confirmRedistributionRequestCompletion,
} from "./mutations";

export {
  getRequestListForAdmin,
  getRequestDetailForAdmin,
  getRequestListForStaff,
  getRequestDetailForStaff,
  getRequestListForManager,
  getRequestDetailForManager,
  getRequestListForAgency,
  getRequestDetailForAgency,
  getRequestHistoryForStaff,
  getRequestHistoryForManager,
  getRequestHistoryForAgency,
} from "./queries";

export const redistributionRoutes = {
  ...mutations,
  ...queries,
} as const;
