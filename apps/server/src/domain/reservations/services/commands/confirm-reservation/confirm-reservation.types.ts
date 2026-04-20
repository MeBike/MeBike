import type { ReservationServiceFailure } from "../../../domain-errors";
import type { ReservationRow } from "../../../models";

/**
 * Public input cho flow xác nhận reservation thành rental.
 */
export type ConfirmReservationInput = {
  readonly reservationId: string;
  readonly userId: string;
  readonly now?: Date;
};

/**
 * Input nội bộ sau khi đã chốt `now` cho toàn bộ transaction.
 */
export type ConfirmReservationCommandInput = ConfirmReservationInput & {
  readonly now: Date;
};

/**
 * Kết quả validate tối thiểu để bước confirm biết reservation nào và bike nào đang được giữ.
 */
export type ConfirmPendingReservationResult = {
  readonly reservation: ReservationRow;
  readonly bikeId: string;
};

/**
 * Dữ liệu read-only đã được chuẩn bị trước khi chạy mutation confirm.
 */
export type PreparedConfirmReservation = ConfirmPendingReservationResult & {
  readonly pricingPolicyId: string;
  readonly requiredBalance: bigint;
};

export type ConfirmReservationFailure = ReservationServiceFailure;
