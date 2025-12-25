import { subscriptionsRoutes as definitions } from "../../subscriptions/routes";

export * from "../../subscriptions/routes";

export const subscriptionsRoutes = {
  ...definitions,
} as const;
