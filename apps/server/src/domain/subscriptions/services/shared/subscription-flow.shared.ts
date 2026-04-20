import { env } from "@/config/env";

import type { ActiveSubscriptionExists, SubscriptionExpired, SubscriptionNotFound, SubscriptionNotPending, SubscriptionNotUsable, SubscriptionPendingOrActiveExists, SubscriptionUsageExceeded } from "../../domain-errors";

/**
 * Tap loi ma flow dung mot luot subscription co the tra ra.
 */
export type UseSubscriptionFailure
  = | SubscriptionNotFound
    | SubscriptionNotUsable
    | SubscriptionExpired
    | SubscriptionUsageExceeded
    | ActiveSubscriptionExists;

/**
 * Tap loi cua flow tao subscription moi.
 */
export type CreateSubscriptionFailure
  = | SubscriptionPendingOrActiveExists
    | import("../../../wallets/domain-errors").InsufficientWalletBalance
    | import("../../../wallets/domain-errors").WalletNotFound;

/**
 * Tap loi cua flow kich hoat subscription.
 */
export type ActivateSubscriptionFailure
  = | SubscriptionNotFound
    | SubscriptionNotPending
    | ActiveSubscriptionExists;

const EXPIRE_AFTER_MS = env.EXPIRE_AFTER_DAYS * 24 * 60 * 60 * 1000;
const AUTO_ACTIVATE_MS = env.AUTO_ACTIVATE_IN_DAYS * 24 * 60 * 60 * 1000;

/**
 * Tinh moc het han tu mot thoi diem bat dau.
 *
 * @param now Moc kich hoat subscription.
 */
export function computeExpiresAt(now: Date): Date {
  return new Date(now.getTime() + EXPIRE_AFTER_MS);
}

/**
 * Tinh moc auto-activate cho job nen sau khi user mua goi.
 *
 * @param now Moc tao subscription pending.
 */
export function computeAutoActivateAt(now: Date): Date {
  return new Date(now.getTime() + AUTO_ACTIVATE_MS);
}
