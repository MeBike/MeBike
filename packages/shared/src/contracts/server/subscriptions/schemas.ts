import { z } from "../../../zod";
import {
  paginationQueryFields,
  PaginationSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../schemas";
import {
  SubscriptionDetailSchema,
  SubscriptionPackageDetailSchema,
  SubscriptionPackageSchema,
  SubscriptionStatusSchema,
} from "./models";

export const SubscriptionErrorCodeSchema = z
  .enum([
    "SUBSCRIPTION_NOT_FOUND",
    "SUBSCRIPTION_NOT_PENDING",
    "SUBSCRIPTION_PENDING_OR_ACTIVE_EXISTS",
    "SUBSCRIPTION_EXPIRED",
    "SUBSCRIPTION_USAGE_EXCEEDED",
    "ACTIVE_SUBSCRIPTION_EXISTS",
    "WALLET_NOT_FOUND",
    "INSUFFICIENT_WALLET_BALANCE",
  ])
  .openapi("SubscriptionErrorCode");

export const subscriptionErrorMessages = {
  SUBSCRIPTION_NOT_FOUND: "Subscription not found",
  SUBSCRIPTION_NOT_PENDING: "Subscription is not pending",
  SUBSCRIPTION_PENDING_OR_ACTIVE_EXISTS: "User already has a pending or active subscription",
  SUBSCRIPTION_EXPIRED: "Subscription has expired",
  SUBSCRIPTION_USAGE_EXCEEDED: "Subscription usage limit exceeded",
  ACTIVE_SUBSCRIPTION_EXISTS: "User already has an active subscription",
  WALLET_NOT_FOUND: "Wallet not found",
  INSUFFICIENT_WALLET_BALANCE: "Insufficient wallet balance",
} as const;

export const SubscriptionErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: SubscriptionErrorCodeSchema,
  }),
}).openapi("SubscriptionErrorResponse");

export const CreateSubscriptionRequestSchema = z.object({
  packageName: SubscriptionPackageSchema,
}).openapi("CreateSubscriptionRequest");

export const CreateSubscriptionResponseSchema = SubscriptionDetailSchema.openapi("CreateSubscriptionResponse");

export const ActivateSubscriptionResponseSchema = SubscriptionDetailSchema.openapi("ActivateSubscriptionResponse");

export const SubscriptionDetailResponseSchema = SubscriptionDetailSchema.openapi("SubscriptionDetailResponse");

export const ListSubscriptionsQuerySchema = z.object({
  ...paginationQueryFields,
  status: SubscriptionStatusSchema.optional(),
}).openapi("ListSubscriptionsQuery");

export const ListSubscriptionsResponseSchema = z.object({
  data: SubscriptionDetailSchema.array(),
  pagination: PaginationSchema,
}).openapi("ListSubscriptionsResponse");

export const ListSubscriptionPackagesResponseSchema = z.object({
  data: SubscriptionPackageDetailSchema.array(),
}).openapi("ListSubscriptionPackagesResponse");

export type SubscriptionErrorResponse = z.infer<typeof SubscriptionErrorResponseSchema>;
export type CreateSubscriptionRequest = z.infer<typeof CreateSubscriptionRequestSchema>;
export type CreateSubscriptionResponse = z.infer<typeof CreateSubscriptionResponseSchema>;
export type ActivateSubscriptionResponse = z.infer<typeof ActivateSubscriptionResponseSchema>;
export type SubscriptionDetailResponse = z.infer<typeof SubscriptionDetailResponseSchema>;
export type ListSubscriptionsResponse = z.infer<typeof ListSubscriptionsResponseSchema>;
export type ListSubscriptionPackagesResponse = z.infer<typeof ListSubscriptionPackagesResponseSchema>;
export type SubscriptionPackageDetail = z.infer<typeof SubscriptionPackageDetailSchema>;

export {
  SubscriptionDetailSchema,
  SubscriptionPackageDetailSchema,
  SubscriptionPackageSchema,
  SubscriptionStatusSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
};
