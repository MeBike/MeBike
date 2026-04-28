import { Effect } from "effect";

import type { WalletCommandServiceTag } from "@/domain/wallets";

import { defectOn } from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { ReservationRow } from "../../models";
import type {
  CancelReservationFailure,
  CancelReservationInput,
} from "./cancel-reservation/cancel-reservation.types";

import {
  persistCancelReservationInTx,
  refundCancelledReservationIfEligible,
} from "./cancel-reservation/cancel-reservation.persistence";
import { prepareCancelReservationInTx } from "./cancel-reservation/cancel-reservation.validation";

export type {
  CancelReservationFailure,
  CancelReservationInput,
} from "./cancel-reservation/cancel-reservation.types";

/**
 * Điều phối flow hủy reservation trong một transaction duy nhất.
 *
 * @param input Dữ liệu đầu vào để hủy reservation.
 * @param input.reservationId ID reservation cần hủy.
 * @param input.userId ID user đang yêu cầu hủy reservation.
 * @param input.now Mốc hiện tại để ghi trạng thái và tính refund eligibility.
 * @returns Reservation đã được cập nhật sang trạng thái `CANCELLED`.
 */
export function cancelReservation(
  input: CancelReservationInput,
): Effect.Effect<
  ReservationRow,
  CancelReservationFailure,
  Prisma | WalletCommandServiceTag
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const normalizedInput = {
      ...input,
      now: input.now ?? new Date(),
    };

    const reservation = yield* runPrismaTransaction(
      client,
      tx =>
        Effect.gen(function* () {
          const prepared = yield* prepareCancelReservationInTx(tx, normalizedInput);

          return yield* persistCancelReservationInTx({
            tx,
            input: normalizedInput,
            prepared,
          });
        }),
    ).pipe(
      defectOn(PrismaTransactionError),
    );

    // TODO(iot): send reservation "cancel" command once IoT integration is ready.
    yield* refundCancelledReservationIfEligible(reservation, normalizedInput.now);

    return reservation;
  });
}
