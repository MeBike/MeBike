import * as mutations from "./mutations";
import * as queries from "./queries";

export {
  createStation,
  deleteStation,
  updateStation,
} from "./mutations";

export {
  adminGetAllStationsRevenue,
  adminListStations,
  agencyGetAssignedStationRevenue,
  agencyGetStation,
  agencyListStations,
  getAllStationsRevenue,
  getBikeRevenueByStation,
  getHighestRevenueStation,
  getNearbyStations,
  getNearestAvailableBike,
  getStation,
  getStationAlerts,
  getStationStats,
  listStations,
  managerGetAssignedStationRevenue,
  staffGetStation,
  staffListStations,
} from "./queries";

export const stationsRoutes = {
  ...mutations,
  ...queries,
} as const;
