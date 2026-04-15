import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  ActiveSubscriptionExists,
  SubscriptionNotFound,
  SubscriptionNotPending,
  SubscriptionNotUsable,
  SubscriptionUsageExceeded,
} from "../domain-errors";
import type {
  AdminSubscriptionRow,
  SubscriptionFilter,
  SubscriptionRow,
  SubscriptionSortField,
} from "../models";
import type {
  ActivateSubscriptionInput,
  CreatePendingSubscriptionInput,
} from "../repository/subscription.repository.types";

export type SubscriptionQueryService = {
  /**
   * Lấy subscription theo id cho các luồng đọc thông thường.
   */
  getById: (
    subscriptionId: string,
  ) => Effect.Effect<Option.Option<SubscriptionRow>>;

  /**
   * Lấy subscription theo id kèm owner summary cho admin.
   */
  getAdminById: (
    subscriptionId: string,
  ) => Effect.Effect<Option.Option<AdminSubscriptionRow>>;

  /**
   * Lấy subscription hiện tại của user trong một tập trạng thái cho trước.
   */
  getCurrentForUser: (
    userId: string,
    statuses: readonly SubscriptionRow["status"][],
  ) => Effect.Effect<Option.Option<SubscriptionRow>>;

  /**
   * Trả về lịch sử subscription phân trang của một user.
   */
  listForUser: (
    userId: string,
    filter: SubscriptionFilter,
    pageReq: PageRequest<SubscriptionSortField>,
  ) => Effect.Effect<PageResult<SubscriptionRow>>;

  /**
   * Trả về danh sách subscription toàn hệ thống cho admin.
   */
  listAll: (
    filter: SubscriptionFilter,
    pageReq: PageRequest<SubscriptionSortField>,
  ) => Effect.Effect<PageResult<AdminSubscriptionRow>>;
};

export type SubscriptionCommandService = {
  /**
   * Tạo subscription mới ở trạng thái `PENDING`.
   */
  createPending: (
    input: CreatePendingSubscriptionInput,
  ) => Effect.Effect<SubscriptionRow>;

  /**
   * Kích hoạt subscription pending và chuẩn hóa lỗi domain khi thao tác thất bại.
   */
  activate: (
    input: ActivateSubscriptionInput,
  ) => Effect.Effect<
    SubscriptionRow,
    ActiveSubscriptionExists | SubscriptionNotFound | SubscriptionNotPending
  >;

  /**
   * Tăng usage cho subscription và map trường hợp thất bại sang lỗi domain dễ hiểu.
   */
  incrementUsage: (
    subscriptionId: string,
    expectedUsageCount: number,
    amount: number,
  ) => Effect.Effect<
    SubscriptionRow,
    SubscriptionNotFound | SubscriptionNotUsable
  >;

  /**
   * Dùng đúng một lượt subscription bên trong transaction hiện có.
   * Caller chỉ truyền `tx`; service tự dựng repo query/command bám theo transaction đó.
   */
  useOne: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: {
      readonly subscriptionId: string;
      readonly userId: string;
      readonly now?: Date;
    },
  ) => Effect.Effect<
    SubscriptionRow,
    | SubscriptionNotFound
    | SubscriptionNotUsable
    | SubscriptionUsageExceeded
  >;

  /**
   * Hết hạn hàng loạt subscription đã quá `expiresAt`.
   */
  markExpiredNow: (
    now: Date,
  ) => Effect.Effect<number>;
};

export type SubscriptionService = SubscriptionQueryService & SubscriptionCommandService;
