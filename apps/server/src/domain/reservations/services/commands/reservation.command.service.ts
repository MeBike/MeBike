import { Effect, Option } from "effect";

import type { ReservationCommandRepo } from "../../repository/reservation-command.repository";
import type { ReservationCommandService } from "../reservation.service.types";

import {
  InvalidReservationTransition,
  ReservationNotFound,
  ReservationNotOwned,
} from "../../domain-errors";
import { makeReservationCommandRepository } from "../../repository/reservation-command.repository";
import { makeReservationQueryRepository } from "../../repository/reservation-query.repository";
import { mapReservationUniqueViolation } from "../../repository/unique-violation";
import { validatePendingReservationForConfirmationInTx } from "./confirm-reservation/confirm-reservation.validation";

export function makeReservationCommandService(
  commandRepo: ReservationCommandRepo,
): ReservationCommandService {
  return {
    markExpiredNow: now => commandRepo.markExpiredNow(now),
    updateStatus: input => commandRepo.updateStatus(input),
    validatePendingForConfirmationInTx: (tx, input) =>
      validatePendingReservationForConfirmationInTx(tx, input),
    cancelPendingInTx: (tx, input) =>
      Effect.gen(function* () {
        const txQueryRepo = makeReservationQueryRepository(tx);
        const txCommandRepo = makeReservationCommandRepository(tx);
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
            to: "CANCELLED",
          }));
        }

        return yield* txCommandRepo.updateStatus({
          reservationId: reservation.id,
          status: "CANCELLED",
          updatedAt: input.now,
        });
      }),
    reserveHoldInTx: (tx, input) =>
      makeReservationCommandRepository(tx).createReservation({
        userId: input.userId,
        bikeId: input.bikeId,
        stationId: input.stationId,
        pricingPolicyId: input.pricingPolicyId,
        reservationOption: input.reservationOption,
        subscriptionId: input.subscriptionId,
        startTime: input.startTime,
        endTime: input.endTime,
        prepaid: input.prepaid,
        status: "PENDING",
      }).pipe(
        Effect.catchTag(
          "ReservationUniqueViolation",
          ({ constraint }) => {
            const mapped = mapReservationUniqueViolation({
              constraint,
              bikeId: input.bikeId,
              userId: input.userId,
            });
            if (mapped) {
              return Effect.fail(mapped);
            }
            return Effect.die(new Error(`Unhandled reservation unique constraint: ${String(constraint)}`));
          },
        ),
      ),
  };
}
