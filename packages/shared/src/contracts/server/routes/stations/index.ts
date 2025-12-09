import * as queries from "./queries";

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
  ...queries,
} as const;
