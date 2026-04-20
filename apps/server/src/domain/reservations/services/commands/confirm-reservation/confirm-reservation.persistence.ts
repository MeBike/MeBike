import { Effect, Option } from "effect";

import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { makeBikeRepository } from "@/domain/bikes";
import { makeRentalRepository } from "@/domain/rentals";
import { RentalRepositoryError } from "@/domain/rentals/domain-errors";
import { createRentalDepositHoldInTx } from "@/domain/rentals/services/commands/rental-deposit-hold.service";
import { rentalUniqueViolationToFailure } from "@/domain/rentals/services/shared/unique-violation-mapper";
import { defectOn } from "@/domain/shared";

import type { ReservationRow } from "../../../models";
import type {
  ConfirmReservationCommandInput,
  ConfirmReservationFailure,
  PreparedConfirmReservation,
} from "./confirm-reservation.types";

import {
  BikeNotAvailable,
  BikeNotFound,
  ReservationConfirmBlockedByActiveRental,
} from "../../../domain-errors";
import { makeReservationCommandRepository } from "../../../repository/reservation-command.repository";

/**
 * Ghi toàn bộ side effect để confirm reservation thành rental.
 *
 * @param args Dữ liệu mutation cho flow confirm reservation.
 * @param args.tx Transaction client đang dùng.
 * @param args.input Input đã được chuẩn hóa `now`.
 * @param args.prepared Snapshot read-only đã validate xong.
 * @returns Reservation đã được chuyển sang `FULFILLED`.
 */
export function persistConfirmReservationInTx(args: {
  readonly tx: PrismaTypes.TransactionClient;
  readonly input: ConfirmReservationCommandInput;
  readonly prepared: PreparedConfirmReservation;
}): Effect.Effect<ReservationRow, ConfirmReservationFailure> {
  return Effect.gen(function* () {
    const { tx, input, prepared } = args;
    const txRentalRepo = makeRentalRepository(tx);
    const txReservationCommandRepo = makeReservationCommandRepository(tx);

    yield* bookReservedBikeForConfirmationInTx(tx, prepared.bikeId, input.now);

    const createdRental = yield* txRentalRepo.createRental({
      userId: input.userId,
      reservationId: prepared.reservation.id,
      bikeId: prepared.bikeId,
      pricingPolicyId: prepared.pricingPolicyId,
      startStationId: prepared.reservation.stationId,
      startTime: input.now,
      subscriptionId: prepared.reservation.subscriptionId ?? null,
    }).pipe(
      Effect.catchTag("RentalUniqueViolation", ({ constraint }) => {
        const mapped = rentalUniqueViolationToFailure({
          constraint,
          bikeId: prepared.bikeId,
          userId: input.userId,
        });

        if (Option.isNone(mapped)) {
          return Effect.die(new Error(
            `Unhandled rental unique constraint while confirming reservation: ${String(constraint)}`,
          ));
        }

        if (mapped.value._tag === "ActiveRentalExists") {
          return Effect.fail(new ReservationConfirmBlockedByActiveRental({ userId: input.userId }));
        }

        return Effect.die(new Error(
          `Invariant violated: bike ${prepared.bikeId} should not be concurrently rented while confirming reservation ${prepared.reservation.id}`,
        ));
      }),
      defectOn(RentalRepositoryError),
    );

    yield* createRentalDepositHoldInTx({
      tx,
      rentalId: createdRental.id,
      userId: input.userId,
      amount: prepared.requiredBalance,
    }).pipe(
      Effect.catchTag("WalletNotFound", err => Effect.fail(err)),
      Effect.catchTag("InsufficientWalletBalance", err => Effect.fail(err)),
      defectOn(RentalRepositoryError),
    );

    return yield* txReservationCommandRepo.updateStatus({
      reservationId: prepared.reservation.id,
      status: "FULFILLED",
      updatedAt: input.now,
    }).pipe(
      Effect.catchTag("ReservationNotFound", err => Effect.die(err)),
    );
  });
}

/**
 * Đổi bike từ `RESERVED` sang `BOOKED` khi reservation được confirm.
 *
 * @param tx Transaction client đang dùng.
 * @param bikeId ID bike đã được giữ bởi reservation.
 * @param now Mốc thời gian dùng cho mutation.
 * @returns `void` nếu bike được book thành công, hoặc fail bằng domain error rõ nghĩa.
 */
function bookReservedBikeForConfirmationInTx(
  tx: PrismaTypes.TransactionClient,
  bikeId: string,
  now: Date,
): Effect.Effect<void, BikeNotFound | BikeNotAvailable> {
  return Effect.gen(function* () {
    const bikeRepo = makeBikeRepository(tx);

    const bikeBooked = yield* bikeRepo.bookBikeIfReserved(bikeId, now);
    if (bikeBooked) {
      return;
    }

    const bikeOpt = yield* bikeRepo.getById(bikeId);
    if (Option.isNone(bikeOpt)) {
      return yield* Effect.fail(new BikeNotFound({ bikeId }));
    }

    return yield* Effect.fail(new BikeNotAvailable({
      bikeId,
      status: bikeOpt.value.status,
    }));
  });
}
