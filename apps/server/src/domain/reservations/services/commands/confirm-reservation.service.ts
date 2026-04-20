import { Effect } from "effect";

import { defectOn } from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { ReservationRow } from "../../models";
import type {
  ConfirmReservationFailure,
  ConfirmReservationInput,
} from "./confirm-reservation/confirm-reservation.types";

import { persistConfirmReservationInTx } from "./confirm-reservation/confirm-reservation.persistence";
import { prepareConfirmReservationInTx } from "./confirm-reservation/confirm-reservation.validation";

export type {
  ConfirmReservationFailure,
  ConfirmReservationInput,
} from "./confirm-reservation/confirm-reservation.types";

/**
 * Điều phối flow confirm reservation trong một transaction duy nhất.
 *
 * @param input Dữ liệu đầu vào để xác nhận reservation.
 * @param input.reservationId ID reservation cần confirm.
 * @param input.userId ID user thực hiện confirm reservation.
 * @param input.now Mốc hiện tại, dùng cho blackout rule và thời điểm bắt đầu rental.
 * @returns Reservation đã được cập nhật sang trạng thái `FULFILLED`.
 */
export function confirmReservation(
  input: ConfirmReservationInput,
): Effect.Effect<
  ReservationRow,
  ConfirmReservationFailure,
  Prisma
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
          const prepared = yield* prepareConfirmReservationInTx(tx, normalizedInput);

          return yield* persistConfirmReservationInTx({
            tx,
            input: normalizedInput,
            prepared,
          });
        }),
    ).pipe(
      defectOn(PrismaTransactionError),
    );

    // TODO(iot): send booking "claim" command once IoT integration is ready.
    return reservation;
  });
}
