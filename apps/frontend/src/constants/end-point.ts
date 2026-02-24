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

    }
} as const;
