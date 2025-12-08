

export const QUERY_KEYS = {
  AUTH: {
    LOGIN: "auth_login",
    LOGOUT: "auth_logout",
    REGISTER: "auth_register",
    USER_PROFILE_QUERY_KEY: ["user", "me"],
  },
  USER: {
    ALL: (page?: number, limit?: number, verify?: string, role?: string) => [
      "user",
      "all",
      { page, limit, verify, role },
    ],
    STATISTICS: ["user", "statistics"],
    ACTIVE_USER: ["user", "active"],
    NEW_REGISTRATION_STATS: ["user", "new-registration-stats"],
    TOP_RENTERS_STATS: ["user", "top-renter"],
    SEARCH_USER: (query: string) => ["searchUser", query],
  },
  BIKE: {},
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
};