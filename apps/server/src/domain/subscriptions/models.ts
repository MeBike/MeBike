import type { SubscriptionPackage, SubscriptionStatus } from "generated/prisma/client";

/**
 * Shape chuẩn của một subscription khi làm việc trong domain.
 * Đây là row lõi, không chứa dữ liệu join thêm từ user.
 */
export type SubscriptionRow = {
  readonly id: string;
  readonly userId: string;
  readonly packageName: SubscriptionPackage;
  readonly maxUsages: number | null;
  readonly usageCount: number;
  readonly status: SubscriptionStatus;
  readonly activatedAt: Date | null;
  readonly expiresAt: Date | null;
  readonly price: bigint;
  readonly updatedAt: Date;
};

/**
 * Thông tin owner rút gọn để admin list/detail có thể hiển thị ngay.
 */
export type SubscriptionOwnerSummary = {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
};

/**
 * Shape subscription mở rộng cho admin, bao gồm cả owner summary.
 */
export type AdminSubscriptionRow = SubscriptionRow & {
  readonly user: SubscriptionOwnerSummary;
};

/**
 * Tập field hiện đang hỗ trợ sort cho list subscriptions.
 */
export type SubscriptionSortField
  = | "updatedAt"
    | "expiresAt"
    | "status"
    | "activatedAt"
    | "packageName";

/**
 * Filter hiện tại của module subscriptions.
 * Hiện mới hỗ trợ lọc theo status để giữ query nhỏ và rõ ràng.
 */
export type SubscriptionFilter = {
  readonly status?: SubscriptionStatus;
};
