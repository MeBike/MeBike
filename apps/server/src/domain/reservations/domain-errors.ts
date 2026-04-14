import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";
import type {
  InsufficientWalletBalance,
  WalletNotFound,
} from "@/domain/wallets/domain-errors";

export class ReservationRepositoryError extends Data.TaggedError("ReservationRepositoryError")<
  WithGenericError
> {}

export class ReservationUniqueViolation extends Data.TaggedError("ReservationUniqueViolation")<
  WithGenericError<{ constraint?: string | string[] }>
> {}

/**
 * EN: User already has an active/pending reservation that blocks a new hold.
 * VI: User đã có reservation đang active/pending nên không thể giữ xe mới.
 */
export class ActiveReservationExists extends Data.TaggedError("ActiveReservationExists")<{
  readonly userId: string;
}> {}

/**
 * EN: Confirming this reservation is blocked because user already has an active rental.
 * VI: Không thể xác nhận reservation vì user đã có rental đang active.
 */
export class ReservationConfirmBlockedByActiveRental extends Data.TaggedError(
  "ReservationConfirmBlockedByActiveRental",
)<{
    readonly userId: string;
  }> {}

/**
 * EN: Bike is already reserved by another reservation.
 * VI: Xe đã bị giữ bởi reservation khác.
 */
export class BikeAlreadyReserved extends Data.TaggedError("BikeAlreadyReserved")<{
  readonly bikeId: string;
}> {}

/**
 * EN: Bike row not found.
 * VI: Không tìm thấy xe.
 */
export class BikeNotFound extends Data.TaggedError("BikeNotFound")<{
  readonly bikeId: string;
}> {}

/**
 * EN: Bike has no station or is not at the requested station.
 * VI: Xe không thuộc trạm hoặc không ở đúng trạm yêu cầu.
 */
export class BikeNotFoundInStation extends Data.TaggedError("BikeNotFoundInStation")<{
  readonly bikeId: string;
  readonly stationId: string;
}> {}

/**
 * EN: Bike cannot be reserved due to its current status.
 * VI: Xe không thể được giữ do trạng thái hiện tại.
 */
export class BikeNotAvailable extends Data.TaggedError("BikeNotAvailable")<{
  readonly bikeId: string;
  readonly status: string;
}> {}

export class StationPickupSlotLimitExceeded extends Data.TaggedError("StationPickupSlotLimitExceeded")<{
  readonly stationId: string;
  readonly pickupSlotLimit: number;
  readonly pendingReservations: number;
}> {}

/**
 * EN: Reservation does not belong to the current user.
 * VI: Reservation không thuộc về user hiện tại.
 */
export class ReservationNotOwned extends Data.TaggedError("ReservationNotOwned")<{
  readonly reservationId: string;
  readonly userId: string;
}> {}

/**
 * EN: Reservation is missing a bike assignment (cannot confirm).
 * VI: Reservation chưa có bike_id nên không thể xác nhận.
 */
export class ReservationMissingBike extends Data.TaggedError("ReservationMissingBike")<{
  readonly reservationId: string;
}> {}

/**
 * EN: Reservation status transition is invalid.
 * VI: Chuyển trạng thái reservation không hợp lệ.
 */
export class InvalidReservationTransition extends Data.TaggedError("InvalidReservationTransition")<{
  readonly reservationId: string;
  readonly from: string;
  readonly to: string;
}> {}

/**
 * EN: Subscription id is required for subscription-based reservation.
 * VI: Cần subscription_id khi đặt bằng gói.
 */
export class SubscriptionRequired extends Data.TaggedError("SubscriptionRequired")<{
  readonly userId: string;
}> {}

/**
 * EN: Reservation option is not supported in this flow.
 * VI: Loại reservation không được hỗ trợ trong luồng này.
 */
export class ReservationOptionNotSupported extends Data.TaggedError("ReservationOptionNotSupported")<{
  readonly option: string;
}> {}

/**
 * EN: Reservation row not found by id (typically mapped from Prisma P2025).
 * VI: Không tìm thấy Reservation theo id (thường được map từ lỗi Prisma P2025).
 */
export class ReservationNotFound extends Data.TaggedError("ReservationNotFound")<{
  readonly reservationId: string;
}> {}

export class FixedSlotTemplateStationNotFound extends Data.TaggedError("FixedSlotTemplateStationNotFound")<{
  readonly stationId: string;
}> {}

/** VI: Không tìm thấy fixed-slot template theo id. */
export class FixedSlotTemplateNotFound extends Data.TaggedError("FixedSlotTemplateNotFound")<{
  readonly templateId: string;
}> {}

/** VI: Ngày fixed-slot không còn ở tương lai theo rule hiện tại của hệ thống. */
export class FixedSlotTemplateDateNotFuture extends Data.TaggedError("FixedSlotTemplateDateNotFuture")<{
  readonly slotDate: string;
}> {}

/** VI: Ngày fixed-slot đã bị khóa, không cho sửa hoặc xóa nữa. */
export class FixedSlotTemplateDateLocked extends Data.TaggedError("FixedSlotTemplateDateLocked")<{
  readonly slotDate: string;
}> {}

/** VI: Không tìm thấy ngày cụ thể bên trong fixed-slot template. */
export class FixedSlotTemplateDateNotFound extends Data.TaggedError("FixedSlotTemplateDateNotFound")<{
  readonly templateId: string;
  readonly slotDate: string;
}> {}

/** VI: User đã có template active trùng giờ và đụng tập ngày với request hiện tại. */
export class FixedSlotTemplateConflict extends Data.TaggedError("FixedSlotTemplateConflict")<{
  readonly userId: string;
  readonly slotStart: string;
  readonly slotDates: ReadonlyArray<string>;
}> {}

/** VI: Billing upfront cho fixed-slot không thể hoàn tất an toàn. */
export class FixedSlotTemplateBillingConflict extends Data.TaggedError("FixedSlotTemplateBillingConflict")<{
  readonly userId: string;
}> {}

/** VI: Hủy fixed-slot template thất bại do conflict trong side effect liên quan. */
export class FixedSlotTemplateCancelConflict extends Data.TaggedError("FixedSlotTemplateCancelConflict")<{
  readonly templateId: string;
}> {}

/** VI: Update fixed-slot template thất bại do conflict trong mutation flow. */
export class FixedSlotTemplateUpdateConflict extends Data.TaggedError("FixedSlotTemplateUpdateConflict")<{
  readonly templateId: string;
}> {}

export type ReservationServiceFailure
  = | ActiveReservationExists
    | ReservationConfirmBlockedByActiveRental
    | BikeAlreadyReserved
    | BikeNotFound
    | BikeNotFoundInStation
    | BikeNotAvailable
    | StationPickupSlotLimitExceeded
    | ReservationOptionNotSupported
    | ReservationNotFound
    | ReservationNotOwned
    | ReservationMissingBike
    | InvalidReservationTransition
    | SubscriptionRequired
    | WalletNotFound
    | InsufficientWalletBalance;
