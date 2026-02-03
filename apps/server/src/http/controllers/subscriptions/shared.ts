import {
  SubscriptionsContracts,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
} from "@mebike/shared";

export type SubscriptionsRoutes = typeof import("@mebike/shared")["serverRoutes"]["subscriptions"];

export const { SubscriptionErrorCodeSchema, subscriptionErrorMessages } = SubscriptionsContracts;

export const unauthorizedBody = {
  error: unauthorizedErrorMessages.UNAUTHORIZED,
  details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
} as const;
