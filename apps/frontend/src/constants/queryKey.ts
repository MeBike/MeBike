export const QUERY_KEYS = {
  ME : ["user", "me"],
  AUTH: {
    LOGIN: "auth_login",
    LOGOUT: "auth_logout",
    REGISTER: "auth_register",
    USER_PROFILE_QUERY_KEY: ["user", "me"],
  },
  USER: {
    ALL: (page?: number, limit?: number, verify?: string, role?: string, search?: string) => [
      "user",
      "all",
      { page, limit, verify, role, search },
    ],
    STATISTICS: ["user", "statistics"],
    ACTIVE_USER: ["user", "active"],
    NEW_REGISTRATION_STATS: ["user", "new-registration-stats"],
    TOP_RENTERS_STATS: ["user", "top-renter"],
    SEARCH_USER: (query: string) => ["searchUser", query],
  },
  BIKE: {
    BIKE_ACTIVITY_STATS: (bikeId: string) => ["bike-activity-stats", bikeId],
    BIKE_STATS: (bikeId: string) => ["bike-stats", bikeId],
    RENTAL_BIKE: (bikeId: string) => ["bike-rentals-history", bikeId],
    ALL: (page?: number, limit?: number, status?: string , station_id?: string, supplier_id?: string) => ["bikes", "all", page, limit, station_id, supplier_id, status]
  },
  RENTAL: {
    ALL_ADMIN_STAFF: (
      page?: number,
      limit?: number,
      start_station?: string,
      end_station?: string,
      status?: string
    ) => [
      "rentals",
      "all-admin-staff",
      page,
      limit,
      start_station,
      end_station,
      status,
    ],
    DETAIL_ADMIN: (id: string) => ["admin-rentals", "detail", id],
    REVENUE: (
      from?: string,
      to?: string,
      groupBy?: "MONTH" | "YEAR" | "DAY"
    ) => ["revenueStats", from, to, groupBy],
  },
  SOS: {
    ALL: (page?: number, limit?: number, status?: string) => [
      "sos-requests",
      { page, limit, status },
    ],
    DETAIL: (id: string) => ["sos-detail", id],
  },
  STATION: {
    ALL: (page?: number, limit?: number, name?: string, search?: string) => [
      "stations",
      "all",
      page,
      limit,
      name,
      search,
    ],
    DETAIL: (stationId: string) => ["station", stationId],
    RESERVATION_STATS_STATION: (stationId: string) => [
      "reservation",
      "stats",
      "station",
      stationId,
    ],
    STATION_REVENUE: ["station-revenue"],
    STATION_BIKE_REVENUE: ["station-bike-revenue"],
    NEAREST_AVAILABLE_BIKE: (latitude: number, longitude: number) => [
      "nearest-available-bike",
      latitude,
      longitude,
    ],
  },
  WALLET: {
    ALL_WALLET_USER: (page?: number, limit?: number) => [
      "all-wallet-users",
      page,
      limit,
    ],
    MANAGE_TRANSACTIONS: (page?: number, limit?: number) => [
      "manage-transactions",
      page,
      limit,
    ],
    WALLET_OVERVIEW: ["wallet-overview"],
    DETAIL_WALLET: (user_id: string) => ["detail-wallet", user_id],
  },
  REFUND: {
    ALL_REFUND_REQUESTS: (page?: number, limit?: number, status?: string) => [
      "refund-requests",
      page,
      limit,
      status,
    ],
    DETAIL_REFUND_REQUEST: (id: string) => ["refund-requests", id],
  },
  WITHDRAW: {
    ALL_WITHDRAW_REQUESTS: (page?: number, limit?: number, status?: string) => [
      "withdraw-requests",
      page,
      limit,
      status,
    ],
    DETAIL_WITHDRAW_REQUEST: (id: string) => ["withdraw-requests", id],
  },
  REPORT: {
    ALL_REPORTS: (page?: number, limit?: number, status?: string) => [
      "all",
      "report",
      page,
      limit,
      status,
    ],
    REPORT_OVERVIEW: ["report-overview"],
    REPORT_IN_PROGRESS: (page: number, limit: number) => [
      "reports",
      "in-progress",
      page,
      limit,
    ],
    DETAIL_REPORT: (id: string) => ["report", id],
  },
  RESERVATION: {
    ALL_RESERVATIONS: (page?: number, limit?: number) => [
      "all-reservations",
      page,
      limit,
    ],
    RESERVATION_STATS: ["reservation", "stats"],
    DETAIL_RESERVATION: (id: string) => ["detail-reservation", id],
  },
};
