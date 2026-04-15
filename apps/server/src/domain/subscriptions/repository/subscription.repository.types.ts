import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { SubscriptionPackage, SubscriptionStatus } from "generated/prisma/client";

import type { ActiveSubscriptionExists } from "../domain-errors";
import type {
  AdminSubscriptionRow,
  SubscriptionFilter,
  SubscriptionRow,
  SubscriptionSortField,
} from "../models";

export type CreatePendingSubscriptionInput = {
  readonly userId: string;
  readonly packageName: SubscriptionPackage;
  readonly maxUsages: number | null;
  readonly price: bigint;
};

export type ActivateSubscriptionInput = {
  readonly subscriptionId: string;
  readonly activatedAt: Date;
  readonly expiresAt: Date;
};

export type SubscriptionQueryRepo = {
  /**
   * Tìm subscription theo id với shape chuẩn dùng cho các luồng đọc thông thường.
   * Hàm này không kèm owner summary của user.
   */
  findById: (
    subscriptionId: string,
  ) => Effect.Effect<Option.Option<SubscriptionRow>>;

  /**
   * Tìm subscription theo id kèm thông tin người sở hữu.
   * Dùng cho admin detail hoặc các màn cần hiển thị owner summary.
   */
  findAdminById: (
    subscriptionId: string,
  ) => Effect.Effect<Option.Option<AdminSubscriptionRow>>;

  /**
   * Lấy subscription mới nhất của user trong một tập trạng thái cho trước.
   * Đây là primitive chính để kiểm tra user còn gói đang chờ kích hoạt hoặc đang dùng hay không.
   */
  findCurrentForUser: (
    userId: string,
    statuses: readonly SubscriptionStatus[],
  ) => Effect.Effect<Option.Option<SubscriptionRow>>;

  /**
   * Lấy danh sách subscription phân trang cho một user.
   * Phục vụ lịch sử mua gói hoặc màn chi tiết tài khoản của user.
   */
  listForUser: (
    userId: string,
    filter: SubscriptionFilter,
    pageReq: PageRequest<SubscriptionSortField>,
  ) => Effect.Effect<PageResult<SubscriptionRow>>;

  /**
   * Lấy danh sách subscription toàn hệ thống cho admin.
   * Kết quả luôn chứa owner summary để UI admin không phải query user bổ sung.
   */
  listAll: (
    filter: SubscriptionFilter,
    pageReq: PageRequest<SubscriptionSortField>,
  ) => Effect.Effect<PageResult<AdminSubscriptionRow>>;
};

export type SubscriptionCommandRepo = {
  /**
   * Tạo một subscription mới ở trạng thái `PENDING`.
   * Repo chỉ lo việc ghi row; các bước như charge ví hoặc enqueue job nằm ở use case phía trên.
   */
  createPending: (
    input: CreatePendingSubscriptionInput,
  ) => Effect.Effect<SubscriptionRow>;

  /**
   * Kích hoạt một subscription đang `PENDING`.
   * Nếu DB phát hiện user đã có một active subscription khác thì repo fail bằng `ActiveSubscriptionExists`.
   */
  activate: (
    input: ActivateSubscriptionInput,
  ) => Effect.Effect<Option.Option<SubscriptionRow>, ActiveSubscriptionExists>;

  /**
   * Tăng usage bằng optimistic concurrency theo `usageCount` hiện tại.
   * Nếu row không còn khớp trạng thái hoặc usageCount nữa thì repo trả về `Option.none()`.
   */
  incrementUsage: (
    subscriptionId: string,
    expectedUsageCount: number,
    amount: number,
    statuses?: readonly SubscriptionStatus[],
  ) => Effect.Effect<Option.Option<SubscriptionRow>>;

  /**
   * Hết hạn hàng loạt các subscription `ACTIVE` đã quá `expiresAt`.
   * Hàm này được job sweep gọi định kỳ nên cần idempotent ở mức updateMany.
   */
  markExpiredNow: (
    now: Date,
  ) => Effect.Effect<number>;
};

export type SubscriptionRepo = SubscriptionQueryRepo & SubscriptionCommandRepo;
