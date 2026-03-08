import * as mutations from "./mutations";
import * as queries from "./queries";

export {
  cancelRental,
  createRental,
  createRentalFromSOS,
  endMyRental,
  endRentalByAdmin,
  processCardTapRental,
  staffCreateRental,
  updateRental,
  requestBikeSwap,
  approveBikeSwapRequest,
} from "./mutations";

export {
  adminGetRental,
  adminListRentals,
  getActiveRentalsByPhone,
  getAllRentals,
  getDashboardSummary,
  getMyCurrentRentals,
  getMyRental,
  getMyRentalCounts,
  getMyRentals,
  getRental,
  getRentalRevenue,
  getRentalsByUser,
  getRentalSummary,
  getStationActivity,
  staffGetRental,
  staffListBikeSwapRequests,
} from "./queries";

export const rentalsRoutes = {
  ...queries,
  ...mutations,
} as const;
