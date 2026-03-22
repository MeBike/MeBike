import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  ReservationNotFound,
  ReservationRepositoryError,
  ReservationUniqueViolation,
} from "../domain-errors";
import type {
  AdminReservationFilter,
  AdminReservationSortField,
  ReservationExpandedDetailRow,
  ReservationFilter,
  ReservationRow,
  ReservationSortField,
} from "../models";
import type { CreateReservationInput, UpdateReservationStatusInput } from "../types";

export type ReservationRepo = {
  /**
   * EN: Creates a reservation row (non-transactional).
   * VI: Tạo reservation (không nằm trong transaction).
   */
  createReservation: (
    input: CreateReservationInput,
  ) => Effect.Effect<ReservationRow, ReservationRepositoryError | ReservationUniqueViolation>;

  /**
   * EN: Finds reservation by id.
   * VI: Tìm reservation theo id.
   */
  findById: (
    reservationId: string,
  ) => Effect.Effect<Option.Option<ReservationRow>, ReservationRepositoryError>;

  /**
   * EN: Finds reservation detail by id with nested user / bike / station summaries.
   * VI: Lấy chi tiết reservation theo id, kèm thông tin rút gọn user / bike / station.
   */
  findExpandedDetailById: (
    reservationId: string,
  ) => Effect.Effect<Option.Option<ReservationExpandedDetailRow>, ReservationRepositoryError>;

  /**
   * Returns the most recently updated reservation with status in (PENDING, compatibility ACTIVE).
   * This is intentionally NOT "current hold"; use `findPendingHoldBy*Now` for the current one-time hold flow.
   */
  findLatestPendingOrActiveByUserId: (
    userId: string,
  ) => Effect.Effect<Option.Option<ReservationRow>, ReservationRepositoryError>;

  /**
   * Returns the most recently updated reservation with status in (PENDING, compatibility ACTIVE).
   * This is intentionally NOT "current hold"; use `findPendingHoldBy*Now` for the current one-time hold flow.
   */
  findLatestPendingOrActiveByBikeId: (
    bikeId: string,
  ) => Effect.Effect<Option.Option<ReservationRow>, ReservationRepositoryError>;

  /**
   * "Hold" = PENDING reservation with a concrete bike + endTime in the future.
   * FIXED_SLOT reservations typically have endTime=null, so they won't match.
   *
   * EN: Use this to check "is there a current hold right now?" (time-window aware).
   * VI: Dùng để kiểm tra "hiện tại có đang giữ xe không?" (có xét theo khung thời gian).
   */
  findPendingHoldByUserIdNow: (
    userId: string,
    now: Date,
  ) => Effect.Effect<Option.Option<ReservationRow>, ReservationRepositoryError>;

  /**
   * "Hold" = PENDING reservation with a concrete bike + endTime in the future.
   *
   * EN: Use this to check if a bike is currently held by a pending reservation.
   * VI: Dùng để kiểm tra xe hiện tại có đang bị giữ bởi reservation pending hay không.
   */
  findPendingHoldByBikeIdNow: (
    bikeId: string,
    now: Date,
  ) => Effect.Effect<Option.Option<ReservationRow>, ReservationRepositoryError>;

  countPendingByStationId: (
    stationId: string,
  ) => Effect.Effect<number, ReservationRepositoryError>;

  /**
   * EN: Find ACTIVE reservation by user id.
   * VI: Tìm reservation ACTIVE theo user id.
   */
  findActiveByUserId: (
    userId: string,
  ) => Effect.Effect<Option.Option<ReservationRow>, ReservationRepositoryError>;

  /**
   * EN: Find a PENDING FIXED_SLOT reservation for a template at a specific start time (bike unassigned).
   * VI: Tìm reservation FIXED_SLOT ở trạng thái PENDING theo template + thời điểm bắt đầu (chưa gán bike).
   */
  findPendingFixedSlotByTemplateAndStart: (
    templateId: string,
    startTime: Date,
  ) => Effect.Effect<Option.Option<ReservationRow>, ReservationRepositoryError>;

  /**
   * EN: Assign bike to a pending reservation if it is still unassigned.
   * VI: Gán bike cho reservation pending nếu vẫn chưa có bike.
   */
  assignBikeToPendingReservation: (
    reservationId: string,
    bikeId: string,
    updatedAt: Date,
  ) => Effect.Effect<boolean, ReservationRepositoryError>;

  /**
   * EN: Returns the next upcoming PENDING reservation (startTime > now). Useful for fixed-slot UX.
   * VI: Trả về reservation PENDING sắp tới (startTime > now). Hữu ích cho UX FIXED_SLOT.
   */
  findNextUpcomingByUserId: (
    userId: string,
    now: Date,
    options?: { readonly onlyFixedSlot?: boolean },
  ) => Effect.Effect<Option.Option<ReservationRow>, ReservationRepositoryError>;

  /**
   * EN: Returns a paginated list of reservations for a user with filters + sorting.
   * VI: Trả về danh sách reservation của user (có phân trang), hỗ trợ filter + sort.
   */
  listForUser: (
    userId: string,
    filter: ReservationFilter,
    pageReq: PageRequest<ReservationSortField>,
  ) => Effect.Effect<PageResult<ReservationRow>, ReservationRepositoryError>;

  /**
   * EN: Returns a paginated reservation list for admin (global scope).
   * VI: Trả về danh sách reservation phân trang cho admin (phạm vi toàn hệ thống).
   */
  listForAdmin: (
    filter: AdminReservationFilter,
    pageReq: PageRequest<AdminReservationSortField>,
  ) => Effect.Effect<PageResult<ReservationRow>, ReservationRepositoryError>;

  /**
   * EN: Updates reservation status (and `updatedAt`) by id, returning the updated row.
   * - Fails with `ReservationNotFound` when the id does not exist (mapped from Prisma P2025).
   * - Fails with `ReservationRepositoryError` for other infra/DB errors.
   *
   * VI: Cập nhật status (và `updatedAt`) theo `reservationId`, trả về row sau khi update.
   * - Fail `ReservationNotFound` nếu id không tồn tại (map từ Prisma P2025).
   * - Fail `ReservationRepositoryError` cho các lỗi DB/infra khác.
   */
  updateStatus: (
    input: UpdateReservationStatusInput,
  ) => Effect.Effect<ReservationRow, ReservationNotFound | ReservationRepositoryError>;

  /**
   * EN: Expire an ACTIVE reservation by id (idempotent).
   * VI: Hết hạn reservation ACTIVE theo id (idempotent).
   */
  expireActive: (
    reservationId: string,
    updatedAt: Date,
  ) => Effect.Effect<boolean, ReservationRepositoryError>;

  /**
   * EN: Expire a single PENDING reservation if endTime < now (idempotent).
   * VI: Hết hạn một reservation PENDING nếu endTime < now (idempotent).
   */
  expirePendingHold: (
    reservationId: string,
    now: Date,
  ) => Effect.Effect<boolean, ReservationRepositoryError>;

  /**
   * EN: Expires PENDING reservations with endTime < now (bulk update).
   * VI: Hết hạn reservation PENDING có endTime < now (update hàng loạt).
   */
  markExpiredNow: (
    now: Date,
  ) => Effect.Effect<number, ReservationRepositoryError>;
};
