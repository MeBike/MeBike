import type { ReservationServiceFailure } from "../../../domain-errors";
import type { ReservationRow } from "../../../models";

/**
 * Public input cho flow hủy reservation hold.
 */
export type CancelReservationInput = {
  readonly reservationId: string;
  readonly userId: string;
  readonly now?: Date;
};

/**
 * Input nội bộ sau khi đã chốt `now` một lần cho toàn bộ flow.
 */
export type CancelReservationCommandInput = CancelReservationInput & {
  readonly now: Date;
};

/**
 * Snapshot read-only dùng cho bước mutation và refund decision.
 */
export type PreparedCancelReservation = {
  readonly reservation: ReservationRow;
};

export type CancelReservationFailure = ReservationServiceFailure;
