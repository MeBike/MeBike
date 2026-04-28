import { Effect, Option } from "effect";

import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { env } from "@/config/env";
import { makeBikeRepository } from "@/domain/bikes";
import { toMinorUnit } from "@/domain/shared/money";
import { WalletCommandServiceTag } from "@/domain/wallets";
import logger from "@/lib/logger";

import type {
  BikeIsDisabled,
  BikeIsLost,
  BikeIsRedistributing,
  BikeNotAvailable,
} from "../../../domain-errors";
import type { ReservationRow } from "../../../models";
import type {
  CancelReservationCommandInput,
  CancelReservationFailure,
  PreparedCancelReservation,
} from "./cancel-reservation.types";

import {
  BikeNotFound,
} from "../../../domain-errors";
import { reservationTransitionFailureFromBikeStatus } from "../../../guards/bike-status";
import { makeReservationCommandRepository } from "../../../repository/reservation-command.repository";

/**
 * Ghi toàn bộ side effect trong transaction để hủy reservation hold.
 *
 * @param args Dữ liệu mutation của flow cancel reservation.
 * @param args.tx Transaction client đang dùng.
 * @param args.input Input đã được chuẩn hóa `now`.
 * @param args.prepared Snapshot reservation đã validate xong.
 * @returns Reservation sau khi được cập nhật sang `CANCELLED`.
 */
export function persistCancelReservationInTx(args: {
  readonly tx: PrismaTypes.TransactionClient;
  readonly input: CancelReservationCommandInput;
  readonly prepared: PreparedCancelReservation;
}): Effect.Effect<ReservationRow, CancelReservationFailure> {
  return Effect.gen(function* () {
    const { tx, input, prepared } = args;
    const txReservationCommandRepo = makeReservationCommandRepository(tx);

    const updatedReservation = yield* txReservationCommandRepo.updateStatus({
      reservationId: prepared.reservation.id,
      status: "CANCELLED",
      updatedAt: input.now,
    }).pipe(
      Effect.catchTag("ReservationNotFound", err => Effect.die(err)),
    );

    if (updatedReservation.bikeId) {
      yield* releaseReservedBikeForCancellationInTx(tx, updatedReservation.bikeId, input.now);
    }

    return updatedReservation;
  });
}

/**
 * Hoàn tiền ngoài transaction khi reservation còn trong cửa sổ refund.
 *
 * @param reservation Reservation vừa bị hủy.
 * @param now Mốc hiện tại để tính eligibility.
 * @returns `void`; lỗi refund được log rồi bỏ qua để không làm fail luồng hủy chính.
 */
export function refundCancelledReservationIfEligible(
  reservation: ReservationRow,
  now: Date,
): Effect.Effect<void, never, WalletCommandServiceTag> {
  return Effect.gen(function* () {
    if (!isRefundEligible(reservation, now)) {
      return;
    }

    const walletService = yield* WalletCommandServiceTag;
    const refundHash = `refund:reservation:${reservation.id}`;
    const description = `Refund reservation ${reservation.id}`;
    const amount = toMinorUnit(reservation.prepaid);

    yield* walletService.creditWallet({
      userId: reservation.userId,
      amount,
      description,
      hash: refundHash,
      type: "REFUND",
    }).pipe(
      Effect.catchAll((err) => {
        logger.warn(
          { err, reservationId: reservation.id, userId: reservation.userId },
          "Reservation refund failed",
        );
        return Effect.succeed(undefined);
      }),
    );
  });
}

/**
 * Release bike khỏi trạng thái `RESERVED` sau khi reservation bị hủy.
 *
 * @param tx Transaction client đang dùng.
 * @param bikeId ID bike đang được giữ cho reservation.
 * @param now Mốc thời gian dùng cho mutation.
 * @returns `void` nếu release thành công, hoặc fail bằng domain error rõ nghĩa.
 */
function releaseReservedBikeForCancellationInTx(
  tx: PrismaTypes.TransactionClient,
  bikeId: string,
  now: Date,
): Effect.Effect<
  void,
  BikeNotFound | BikeNotAvailable | BikeIsRedistributing | BikeIsLost | BikeIsDisabled
> {
  return Effect.gen(function* () {
    const bikeRepo = makeBikeRepository(tx);

    const bikeReleased = yield* bikeRepo.releaseBikeIfReserved(bikeId, now);
    if (bikeReleased) {
      return;
    }

    const bikeOpt = yield* bikeRepo.getById(bikeId);
    if (Option.isNone(bikeOpt)) {
      return yield* Effect.fail(new BikeNotFound({ bikeId }));
    }

    return yield* Effect.fail(reservationTransitionFailureFromBikeStatus({
      bikeId,
      status: bikeOpt.value.status,
    }));
  });
}

/**
 * Rule hoàn tiền cho reservation one-time bị hủy sớm.
 *
 * @param reservation Reservation đã bị hủy.
 * @param now Mốc hiện tại để tính cửa sổ refund.
 * @returns `true` khi reservation đủ điều kiện refund prepaid.
 */
function isRefundEligible(reservation: ReservationRow, now: Date): boolean {
  if (reservation.reservationOption !== "ONE_TIME") {
    return false;
  }
  if (reservation.subscriptionId) {
    return false;
  }
  if (reservation.fixedSlotTemplateId) {
    return false;
  }

  const refundPeriodMs = env.REFUND_PERIOD_HOURS * 60 * 60 * 1000;
  return reservation.createdAt.getTime() + refundPeriodMs > now.getTime();
}
