import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";

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
 * EN: Reserved rental row not found (reservation-rental pair broken).
 * VI: Không tìm thấy rental RESERVED tương ứng với reservation.
 */
export class ReservedRentalNotFound extends Data.TaggedError("ReservedRentalNotFound")<{
  readonly reservationId: string;
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

export type ReservationServiceFailure
  = | ActiveReservationExists
    | BikeAlreadyReserved
    | BikeNotFound
    | BikeNotFoundInStation
    | BikeNotAvailable
    | ReservationOptionNotSupported
    | ReservationNotFound
    | ReservationNotOwned
    | ReservationMissingBike
    | InvalidReservationTransition
    | ReservedRentalNotFound
    | SubscriptionRequired;
