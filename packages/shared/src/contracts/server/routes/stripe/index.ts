import { startStripeConnectOnboardingRoute } from "./mutations";

export * from "../../stripe/schemas";
export * from "./mutations";

export const stripeRoutes = {
  startStripeConnectOnboarding: startStripeConnectOnboardingRoute,
} as const;
