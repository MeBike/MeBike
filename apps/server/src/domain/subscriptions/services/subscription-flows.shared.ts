import { env } from "@/config/env";

import type { ActiveSubscriptionExists, SubscriptionExpired, SubscriptionNotFound, SubscriptionNotPending, SubscriptionNotUsable, SubscriptionPendingOrActiveExists, SubscriptionUsageExceeded } from "../domain-errors";

/**
 * Tập lỗi mà flow dùng một lượt subscription có thể trả ra.
 */
export type UseSubscriptionFailure
  = | SubscriptionNotFound
    | SubscriptionNotUsable
    | SubscriptionExpired
    | SubscriptionUsageExceeded
    | ActiveSubscriptionExists;

/**
 * Tập lỗi của flow tạo subscription mới.
 */
export type CreateSubscriptionFailure
  = | SubscriptionPendingOrActiveExists
    | import("../../wallets/domain-errors").InsufficientWalletBalance
    | import("../../wallets/domain-errors").WalletNotFound;

/**
 * Tập lỗi của flow kích hoạt subscription.
 */
export type ActivateSubscriptionFailure
  = | SubscriptionNotFound
    | SubscriptionNotPending
    | ActiveSubscriptionExists;

const EXPIRE_AFTER_MS = env.EXPIRE_AFTER_DAYS * 24 * 60 * 60 * 1000;
const AUTO_ACTIVATE_MS = env.AUTO_ACTIVATE_IN_DAYS * 24 * 60 * 60 * 1000;

/**
 * Tính mốc hết hạn từ một thời điểm bắt đầu.
 */
export function computeExpiresAt(now: Date): Date {
  return new Date(now.getTime() + EXPIRE_AFTER_MS);
}

/**
 * Tính mốc auto-activate cho job nền sau khi user mua gói.
 */
export function computeAutoActivateAt(now: Date): Date {
  return new Date(now.getTime() + AUTO_ACTIVATE_MS);
}
