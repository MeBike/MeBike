import * as mutations from "./mutations";
import * as queries from "./queries";

export {
  createStation,
  deleteStation,
  updateStation,
} from "./mutations";

export {
  getAllStationsRevenue,
  getBikeRevenueByStation,
  getHighestRevenueStation,
  getNearbyStations,
  getNearestAvailableBike,
  getStation,
  getStationAlerts,
  getStationStats,
  listStations,
} from "./queries";

export const stationsRoutes = {
  ...mutations,
  ...queries,
} as const;
