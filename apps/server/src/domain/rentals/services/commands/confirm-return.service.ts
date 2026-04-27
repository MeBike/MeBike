import { Effect } from "effect";

import { BikeRepository } from "@/domain/bikes";
import {
  defectOn,
  isWithinOvernightOperationsWindow,
  makeOvernightOperationsClosedError,
} from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { RentalServiceFailure } from "../../domain-errors";
import type { RentalRow } from "../../models";
import type { ConfirmRentalReturnInput } from "../../types";

import {
  RentalRepositoryError,
} from "../../domain-errors";
import { RentalRepository } from "../../repository/rental.repository";
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
  | BikeRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    yield* RentalRepository;
    yield* ReturnSlotRepository;
    yield* BikeRepository;
    const now = input.now ?? new Date();
    const runtimeInput = { ...input, now };

    if (
      (runtimeInput.operatorRole === "STAFF" || runtimeInput.operatorRole === "AGENCY")
      && isWithinOvernightOperationsWindow(now)
    ) {
      return yield* Effect.fail(makeOvernightOperationsClosedError(now));
    }

    const completedRental = yield* runPrismaTransaction(
      client,
      tx =>
        Effect.gen(function* () {
          const rental = yield* loadConfirmableRentalInTx(tx, runtimeInput.rentalId);
          const operator = yield* resolveConfirmReturnOperatorInTx(tx, runtimeInput).pipe(
            defectOn(RentalRepositoryError),
          );

          yield* ensureOperatorCanConfirmReturnInTx({
            tx,
            input: runtimeInput,
            rental,
            operator,
          }).pipe(defectOn(RentalRepositoryError));

          yield* ensureReturnDestinationReadyInTx({
            tx,
            input: runtimeInput,
            rental,
          });

          yield* createReturnConfirmationInTx({
            tx,
            input: runtimeInput,
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
