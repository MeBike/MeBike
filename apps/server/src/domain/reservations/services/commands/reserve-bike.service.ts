import { Effect } from "effect";

import { SubscriptionCommandServiceTag } from "@/domain/subscriptions";
import { defectOn } from "@/domain/shared";
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
