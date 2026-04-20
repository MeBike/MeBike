import { Effect } from "effect";

import { BikeRepository } from "@/domain/bikes";
import { defectOn } from "@/domain/shared";
import { SubscriptionCommandServiceTag } from "@/domain/subscriptions";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { RentalServiceFailure } from "../domain-errors";
import type { RentalRow } from "../models";
import type { StartRentalInput } from "../types";

import { RentalRepository } from "../repository/rental.repository";
import { persistStartRentalInTx } from "./start-rental/start-rental.persistence";
import { prepareStartRentalInTx } from "./start-rental/start-rental.validation";

/**
 * Điều phối flow bắt đầu thuê xe trong một transaction duy nhất.
 *
 * Bước đọc/kiểm tra được tách khỏi bước ghi dữ liệu,
 * để caller vẫn chỉ nhìn thấy một public entrypoint gọn và dễ đọc.
 */
export function startRental(
  input: StartRentalInput,
): Effect.Effect<
  RentalRow,
  RentalServiceFailure,
  Prisma | RentalRepository | BikeRepository | SubscriptionCommandServiceTag
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    yield* RentalRepository;
    yield* BikeRepository;
    const subscriptionCommandService = yield* SubscriptionCommandServiceTag;

    const rental = yield* runPrismaTransaction(
      client,
      tx =>
        Effect.gen(function* () {
          const prepared = yield* prepareStartRentalInTx(tx, input);

          return yield* persistStartRentalInTx({
            tx,
            input,
            prepared,
            subscriptionCommandService,
          });
        }),
    ).pipe(
      defectOn(PrismaTransactionError),
    );

    return rental;
  });
}
