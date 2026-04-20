import { Effect, Option } from "effect";

import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { makePricingPolicyRepository } from "@/domain/pricing";
import {
  isWithinOvernightOperationsWindow,
  makeOvernightOperationsClosedError,
} from "@/domain/shared";
import { toMinorUnit } from "@/domain/shared/money";

import type {
  ConfirmPendingReservationResult,
  ConfirmReservationCommandInput,
  ConfirmReservationFailure,
  PreparedConfirmReservation,
} from "./confirm-reservation.types";

import {
  InvalidReservationTransition,
  ReservationMissingBike,
  ReservationNotFound,
  ReservationNotOwned,
} from "../../../domain-errors";
import { makeReservationQueryRepository } from "../../../repository/reservation-query.repository";

/**
 * Validate reservation còn đủ điều kiện để confirm trong transaction hiện tại.
 *
 * @param tx Transaction client đang dùng.
 * @param input Dữ liệu xác nhận reservation.
 * @param input.reservationId ID reservation cần confirm.
 * @param input.userId ID user đang thực hiện confirm.
 * @param input.now Mốc hiện tại để chặn reservation đã hết hạn.
 * @returns Reservation kèm `bikeId` đã được xác nhận là hợp lệ để bước persistence dùng tiếp.
 */
export function validatePendingReservationForConfirmationInTx(
  tx: PrismaTypes.TransactionClient,
  input: {
    readonly reservationId: string;
    readonly userId: string;
    readonly now: Date;
  },
): Effect.Effect<
  ConfirmPendingReservationResult,
  | ReservationNotFound
  | ReservationNotOwned
  | ReservationMissingBike
  | InvalidReservationTransition
> {
  return Effect.gen(function* () {
    const txQueryRepo = makeReservationQueryRepository(tx);
    const reservationOpt = yield* txQueryRepo.findById(input.reservationId);
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
        to: "FULFILLED",
      }));
    }

    if (reservation.endTime && reservation.endTime <= input.now) {
      return yield* Effect.fail(new InvalidReservationTransition({
        reservationId: reservation.id,
        from: reservation.status,
        to: "FULFILLED",
      }));
    }

    if (!reservation.bikeId) {
      return yield* Effect.fail(new ReservationMissingBike({ reservationId: reservation.id }));
    }

    return {
      reservation,
      bikeId: reservation.bikeId,
    };
  });
}

/**
 * Chạy toàn bộ bước kiểm tra read-only trước khi confirm reservation.
 *
 * @param tx Transaction client đang dùng.
 * @param input Dữ liệu xác nhận reservation đã được chuẩn hóa `now`.
 * @param input.reservationId ID reservation cần confirm.
 * @param input.userId ID user đang confirm reservation.
 * @param input.now Mốc hiện tại để áp dụng blackout và expiration rule.
 * @returns Snapshot đã validate xong cho bước persistence.
 */
export function prepareConfirmReservationInTx(
  tx: PrismaTypes.TransactionClient,
  input: ConfirmReservationCommandInput,
): Effect.Effect<PreparedConfirmReservation, ConfirmReservationFailure> {
  return Effect.gen(function* () {
    const txPricingPolicyRepo = makePricingPolicyRepository(tx);

    if (isWithinOvernightOperationsWindow(input.now)) {
      return yield* Effect.fail(makeOvernightOperationsClosedError(input.now));
    }

    const { reservation, bikeId } = yield* validatePendingReservationForConfirmationInTx(tx, input);
    const pricingPolicyId = reservation.pricingPolicyId
      ?? (yield* txPricingPolicyRepo.getActive().pipe(
        Effect.catchTag("ActivePricingPolicyNotFound", err => Effect.die(err)),
        Effect.catchTag("ActivePricingPolicyAmbiguous", err => Effect.die(err)),
        Effect.map(policy => policy.id),
      ));
    const pricingPolicy = yield* txPricingPolicyRepo.getById(pricingPolicyId).pipe(
      Effect.catchTag("PricingPolicyNotFound", err => Effect.die(err)),
    );

    return {
      reservation,
      bikeId,
      pricingPolicyId,
      requiredBalance: toMinorUnit(pricingPolicy.depositRequired),
    };
  });
}
