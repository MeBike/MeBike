import { Effect, Option } from "effect";

import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type {
  CancelReservationCommandInput,
  CancelReservationFailure,
  PreparedCancelReservation,
} from "./cancel-reservation.types";

import {
  InvalidReservationTransition,
  ReservationNotFound,
  ReservationNotOwned,
} from "../../../domain-errors";
import { makeReservationQueryRepository } from "../../../repository/reservation-query.repository";

/**
 * Chạy toàn bộ bước kiểm tra read-only trước khi hủy reservation.
 *
 * @param tx Transaction client đang dùng.
 * @param input Dữ liệu hủy reservation đã được chuẩn hóa `now`.
 * @param input.reservationId ID reservation cần hủy.
 * @param input.userId ID user đang yêu cầu hủy.
 * @param input.now Mốc hiện tại để giữ chữ ký input thống nhất giữa các command flow.
 * @returns Snapshot reservation đã xác nhận hợp lệ để bước mutation dùng tiếp.
 */
export function prepareCancelReservationInTx(
  tx: PrismaTypes.TransactionClient,
  input: CancelReservationCommandInput,
): Effect.Effect<PreparedCancelReservation, CancelReservationFailure> {
  return Effect.gen(function* () {
    const txReservationQueryRepo = makeReservationQueryRepository(tx);
    const reservationOpt = yield* txReservationQueryRepo.findById(input.reservationId);
    if (Option.isNone(reservationOpt)) {
      return yield* Effect.fail(new ReservationNotFound({ reservationId: input.reservationId }));
    }

    const reservation = reservationOpt.value;
    if (reservation.userId !== input.userId) {
      return yield* Effect.fail(new ReservationNotOwned({
        reservationId: reservation.id,
        userId: input.userId,
      }));
    }

    if (reservation.status !== "PENDING") {
      return yield* Effect.fail(new InvalidReservationTransition({
        reservationId: reservation.id,
        from: reservation.status,
        to: "CANCELLED",
      }));
    }

    return { reservation };
  });
}
