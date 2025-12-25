import {
  activateSubscriptionRoute,
  createSubscriptionRoute,
} from "./mutations";
import {
  getSubscriptionRoute,
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
} as const;
