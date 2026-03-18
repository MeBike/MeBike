import * as mutations from "./mutations";
import * as queries from "./queries";

export {
  approveBikeSwapRequest,
  cancelRental,
  createRental,
  createRentalFromSOS,
  endMyRental,
  endRentalByAdmin,
  processCardTapRental,
  rejectBikeSwapRequest,
  requestBikeSwap,
  staffCreateRental,
  updateRental,
} from "./mutations";

export {
  adminGetBikeSwapRequests,
  adminGetRental,
  adminListBikeSwapRequests,
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
  getRentalStatsSummary,
  getRentalSummary,
  getStationActivity,
  staffGetBikeSwapRequests,
  staffGetRental,
  staffListBikeSwapRequests,
  staffListRentals,
} from "./queries";

export const rentalsRoutes = {
  ...queries,
  ...mutations,
} as const;
