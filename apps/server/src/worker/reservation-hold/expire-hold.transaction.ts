import { Effect, Option } from "effect";

import { makeBikeRepository } from "@/domain/bikes";
import {
  makeReservationCommandRepository,
  makeReservationQueryRepository,
} from "@/domain/reservations";
import { Prisma } from "@/infrastructure/prisma";

import type { ReservationExpireHoldTransactionOutcome } from "./types";

/**
 * Hết hạn một reservation hold trong transaction DB duy nhất.
 *
 * Transaction này là phần state mutation của job `reservations.expireHold`:
 * đọc reservation, kiểm tra nó còn `PENDING` và đã quá hạn, chuyển reservation
 * sang hết hạn, rồi nhả xe nếu xe vẫn đang reserved. Hàm trả về outcome nhỏ để
 * handler bên ngoài quyết định có cần gửi email hay không.
 *
 * @param input Dữ liệu để chạy transaction hết hạn reservation.
 * @param input.reservationId ID reservation cần kiểm tra và expire.
 * @param input.now Mốc thời gian worker đang xử lý job.
 * @returns Outcome của transaction, bao gồm thông tin cần gửi email nếu expire thành công.
 */
export function expireReservationHoldInTransaction(input: {
  readonly reservationId: string;
  readonly now: Date;
}): Effect.Effect<ReservationExpireHoldTransactionOutcome, never, Prisma> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;

    return yield* Effect.tryPromise({
      try: async () => {
        return await client.$transaction(async (tx) => {
          const txBikeRepo = makeBikeRepository(tx);
          const txReservationQueryRepo = makeReservationQueryRepository(tx);
          const txReservationCommandRepo = makeReservationCommandRepository(tx);
          const reservationOpt = await Effect.runPromise(
            txReservationQueryRepo.findById(input.reservationId),
          );

          if (Option.isNone(reservationOpt)) {
            return { outcome: "NOT_FOUND" as const };
          }

          const reservation = reservationOpt.value;
          if (reservation.status !== "PENDING") {
            return { outcome: "SKIPPED" as const, reason: "NOT_PENDING" as const };
          }
          if (!reservation.endTime || reservation.endTime > input.now) {
            return { outcome: "SKIPPED" as const, reason: "NOT_DUE" as const };
          }
          if (!reservation.bikeId) {
            return { outcome: "SKIPPED" as const, reason: "MISSING_BIKE" as const };
          }

          const expired = await Effect.runPromise(
            txReservationCommandRepo.expirePendingHold(reservation.id, input.now),
          );
          if (!expired) {
            return { outcome: "SKIPPED" as const, reason: "ALREADY_HANDLED" as const };
          }

          await Effect.runPromise(
            txBikeRepo.releaseBikeIfReserved(reservation.bikeId, input.now),
          );

          return {
            outcome: "EXPIRED" as const,
            reservationId: reservation.id,
            userId: reservation.userId,
            stationId: reservation.stationId,
            bikeId: reservation.bikeId,
            endTime: reservation.endTime,
          };
        });
      },
      catch: err => err as unknown,
    }).pipe(
      Effect.catchAll(err => Effect.die(err)),
    );
  });
}
