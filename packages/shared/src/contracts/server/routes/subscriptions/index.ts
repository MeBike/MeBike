import {
  activateSubscriptionRoute,
  createSubscriptionRoute,
} from "./mutations";
import {
  getSubscriptionRoute,
  listSubscriptionPackagesRoute,
  listSubscriptionsRoute,
} from "./queries";

export * from "../../subscriptions/schemas";
export * from "./mutations";
export * from "./queries";

export const subscriptionsRoutes = {
  createSubscription: createSubscriptionRoute,
  activateSubscription: activateSubscriptionRoute,
  getSubscription: getSubscriptionRoute,
  listSubscriptions: listSubscriptionsRoute,
  listSubscriptionPackages: listSubscriptionPackagesRoute,
} as const;
