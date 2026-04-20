import { Effect } from "effect";

import { BikeRepository } from "@/domain/bikes";
import { defectOn } from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { RentalServiceFailure } from "../../domain-errors";
import type { RentalRow } from "../../models";
import type { ConfirmRentalReturnInput } from "../../types";

import {
  RentalRepositoryError,
} from "../../domain-errors";
import { RentalRepository } from "../../repository/rental.repository";
import {
  ReturnConfirmationRepository,
} from "../../repository/return-confirmation.repository";
import { ReturnSlotRepository } from "../../repository/return-slot.repository";
import { enqueueEnvironmentImpactCalculationJob } from "../workers/environment-impact-job.service";
import {
  createReturnConfirmationInTx,
  ensureOperatorCanConfirmReturnInTx,
  ensureReturnDestinationReadyInTx,
  loadConfirmableRentalInTx,
  resolveConfirmReturnOperatorInTx,
} from "./confirm-return/confirm-return.guard";
import { finalizeRentalReturnInTx } from "./finalize-rental-return";

/**
 * Điều phối flow xác nhận trả xe bởi staff hoặc agency trong một transaction.
 *
 * Hàm public này chỉ giữ thứ tự nghiệp vụ ở mức cao:
 * nạp rental, kiểm tra quyền, kiểm tra station trả, ghi confirmation,
 * rồi mới hoàn tất rental và đẩy job hậu xử lý.
 */
export function confirmRentalReturnByOperator(
  input: ConfirmRentalReturnInput,
): Effect.Effect<
  RentalRow,
  RentalServiceFailure,
  | Prisma
  | RentalRepository
  | ReturnSlotRepository
  | ReturnConfirmationRepository
  | BikeRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    yield* RentalRepository;
    yield* ReturnSlotRepository;
    yield* ReturnConfirmationRepository;
    yield* BikeRepository;

    const completedRental = yield* runPrismaTransaction(
      client,
      tx =>
        Effect.gen(function* () {
          const rental = yield* loadConfirmableRentalInTx(tx, input.rentalId);
          const operator = yield* resolveConfirmReturnOperatorInTx(tx, input).pipe(
            defectOn(RentalRepositoryError),
          );

          yield* ensureOperatorCanConfirmReturnInTx({
            tx,
            input,
            rental,
            operator,
          }).pipe(defectOn(RentalRepositoryError));

          yield* ensureReturnDestinationReadyInTx({
            tx,
            input,
            rental,
          });

          yield* createReturnConfirmationInTx({
            tx,
            input,
            rental,
          });

          return yield* finalizeRentalReturnInTx({
            tx,
            rental,
            bikeId: rental.bikeId,
            endStationId: input.stationId,
            endTime: input.confirmedAt,
          });
        }),
    ).pipe(
      defectOn(PrismaTransactionError),
    );

    yield* enqueueEnvironmentImpactCalculationJob(client, {
      rentalId: completedRental.id,
    });

    return completedRental;
  });
}
