export const ENDPOINT = {
    AUTH: {
        LOGIN: "/auth/login",
        REGISTER: "/auth/register",
        LOGOUT: "/auth/logout",
        LOGOUT_ALL: "/auth/logout-all",
        RESEND_VERIFY_EMAIL: "/auth/verify-email/resend",
        SEND_VERIFY_EMAIL: "/auth/verify-email/send",
        VERIFY_EMAIL: "/auth/verify-email/otp",
        GET_ME: "/users/me",
        REFRESH_TOKEN: "/auth/refresh",
        CHANGE_PASSWORD: "/users/change-password",
        FORGOT_PASSWORD: "/auth/password/reset/send",
        VERIFY_FORGOT_PASSWORD: "/users/verify-forgot-password",
        RESET_PASSWORD: "/users/reset-password",
    },
    STATION : {
        BASE : "/stations",
        DETAIL : (stationId: string) => `/stations/${stationId}`,
        NEAR_BY : "/stations/nearby",
        STATION_BIKE_REVENUE: () => "/stations/bike-revenue",
        STATION_REVENUE: () => "/stations/revenue",
        STATION_NEAREST_AVAILABLE_BIKE: () =>
            "/stations/nearest-available-bike",
    },
    SUPPLIER : {
        BASE : "/suppliers",
        DETAIL : (id : string) => `/suppliers/${id}`,
        STATS : "/suppliers/stats",
        STATS_BIKE : (id : string) => `/suppliers/${id}/stats`,
    },
    USER : {
        BASE : "/users/manage-users/get-all",
        DETAIL : (id : string) => `/users/manage-users/${id}`,
        MANAGE_USER : "/users/manage",
        SEARCH_USER : "/users/manage-users/search",
        UPDATE : (id: string) => `/users/manage-users/${id}`, 
        STATS_ACTIVE_USER : "/users/manage-users/stats/active-users",
        STATS_TOP_RENTER : "/users/manage-users/stats/top-renters",
        DASHBOARD_USER_STATS : "/users/manage-users/dashboard-stats",
        STATS_USER : "/users/manage-users/stats",
        NEW_USER : "/users/manage-users/stats/new-users",
        RESET_PASSWORD : (id: string) => `/users/manage-users/admin-reset-password/${id}`,
        CREATE_USER : "/users/manage-users/create",

    },

} as const;
