

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
};