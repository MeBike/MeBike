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
 * Dữ liệu read-only đã được chuẩn bị trước khi chạy mutation confirm.
 */
export type PreparedConfirmReservation = {
  readonly reservation: ReservationRow;
  readonly bikeId: string;
  readonly pricingPolicyId: string;
  readonly requiredBalance: bigint;
};

export type ConfirmReservationFailure = ReservationServiceFailure;
