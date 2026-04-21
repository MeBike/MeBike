import * as mutations from "./mutations";
import * as queries from "./queries";

export {
  createStation,
  deleteStation,
  updateStation,
} from "./mutations";

export {
  adminGetAllStationsRevenue,
  agencyGetStation,
  agencyGetAssignedStationRevenue,
  agencyListStations,
  adminListStations,
  getAllStationsRevenue,
  getBikeRevenueByStation,
  getHighestRevenueStation,
  getNearbyStations,
  getNearestAvailableBike,
  getStation,
  managerGetAssignedStationRevenue,
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
