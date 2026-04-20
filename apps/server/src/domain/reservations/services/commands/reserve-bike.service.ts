import { Effect } from "effect";

import { defectOn } from "@/domain/shared";
import { SubscriptionCommandServiceTag } from "@/domain/subscriptions";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { ReservationRow } from "../../models";
import type { ReserveBikeFailure, ReserveBikeInput } from "./reserve-bike/reserve-bike.types";

import { persistReserveBikeInTx } from "./reserve-bike/reserve-bike.persistence";
import { prepareReserveBikeInTx } from "./reserve-bike/reserve-bike.validation";

export type { ReserveBikeFailure, ReserveBikeInput } from "./reserve-bike/reserve-bike.types";

/**
 * Điều phối flow tạo reservation hold trong một transaction duy nhất.
 *
 * Giống hướng tổ chức của rentals:
 * - bước `prepare` chỉ đọc và validate state
 * - bước `persist` mới ghi side effect
 *
 * Nhờ đó public entrypoint vẫn gọn, nhưng logic bên trong dễ đọc và dễ test hơn.
 *
 * @param input Dữ liệu đầu vào để tạo reservation hold.
 * @param input.userId ID user yêu cầu giữ xe.
 * @param input.bikeId ID bike cần giữ.
 * @param input.stationId ID station mà bike phải đang thuộc về.
 * @param input.startTime Thời điểm bắt đầu reservation.
 * @param input.reservationOption Cách charge reservation: one-time hay subscription.
 * @param input.subscriptionId ID subscription nếu flow dùng gói.
 * @param input.endTime Thời điểm kết thúc hold nếu caller muốn override mặc định.
 * @param input.now Mốc hiện tại để áp dụng blackout và scheduling outbox.
 */
export function reserveBike(
  input: ReserveBikeInput,
): Effect.Effect<
  ReservationRow,
  ReserveBikeFailure,
  Prisma | SubscriptionCommandServiceTag
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const subscriptionCommandService = yield* SubscriptionCommandServiceTag;
    const normalizedInput = {
      ...input,
      now: input.now ?? new Date(),
    };

    const reservation = yield* runPrismaTransaction(
      client,
      tx =>
        Effect.gen(function* () {
          const prepared = yield* prepareReserveBikeInTx(tx, normalizedInput);

          return yield* persistReserveBikeInTx({
            tx,
            input: normalizedInput,
            prepared,
            subscriptionCommandService,
          });
        }),
    ).pipe(
      defectOn(PrismaTransactionError),
    );

    return reservation;
  });
}
