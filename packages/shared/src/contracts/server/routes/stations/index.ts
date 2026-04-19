import * as mutations from "./mutations";
import * as queries from "./queries";

export {
  createStation,
  deleteStation,
  updateStation,
} from "./mutations";

export {
  agencyGetStation,
  agencyListStations,
  adminListStations,
  getAllStationsRevenue,
  getBikeRevenueByStation,
  getHighestRevenueStation,
  getNearbyStations,
  getNearestAvailableBike,
  getStation,
  staffGetStation,
  getStationAlerts,
  getStationStats,
  listStations,
  staffListStations,
} from "./queries";

export const stationsRoutes = {
  ...mutations,
  ...queries,
} as const;
