import {
  activateSubscriptionRoute,
  createSubscriptionRoute,
} from "./mutations";
import {
  adminGetSubscriptionRoute,
  adminListSubscriptionsRoute,
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
  adminGetSubscription: adminGetSubscriptionRoute,
  adminListSubscriptions: adminListSubscriptionsRoute,
  listSubscriptionPackages: listSubscriptionPackagesRoute,
} as const;
