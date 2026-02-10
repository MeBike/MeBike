import { env } from "@/config/env";

import type { ActiveSubscriptionExists, SubscriptionExpired, SubscriptionNotFound, SubscriptionNotPending, SubscriptionNotUsable, SubscriptionPendingOrActiveExists, SubscriptionRepositoryError, SubscriptionUsageExceeded } from "../domain-errors";

export type UseSubscriptionFailure
  = | SubscriptionNotFound
    | SubscriptionNotUsable
    | SubscriptionExpired
    | SubscriptionUsageExceeded
    | SubscriptionRepositoryError
    | ActiveSubscriptionExists;

export type CreateSubscriptionFailure
  = | SubscriptionPendingOrActiveExists
    | SubscriptionRepositoryError
    | import("../../wallets/domain-errors").InsufficientWalletBalance
    | import("../../wallets/domain-errors").WalletNotFound
    | import("../../wallets/domain-errors").WalletRepositoryError;

export type ActivateSubscriptionFailure
  = | SubscriptionNotFound
    | SubscriptionNotPending
    | SubscriptionRepositoryError
    | ActiveSubscriptionExists;

const EXPIRE_AFTER_MS = env.EXPIRE_AFTER_DAYS * 24 * 60 * 60 * 1000;
const AUTO_ACTIVATE_MS = env.AUTO_ACTIVATE_IN_DAYS * 24 * 60 * 60 * 1000;

export function computeExpiresAt(now: Date): Date {
  return new Date(now.getTime() + EXPIRE_AFTER_MS);
}

export function computeAutoActivateAt(now: Date): Date {
  return new Date(now.getTime() + AUTO_ACTIVATE_MS);
}
