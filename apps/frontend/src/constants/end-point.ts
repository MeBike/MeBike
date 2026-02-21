export const AUTH_ENDPOINT = {
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
    }
} as const;
