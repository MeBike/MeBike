import { Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  ActiveReservationExists,
  BikeAlreadyReserved,
} from "../domain-errors";
import type { ReservationFilter, ReservationRow, ReservationSortField } from "../models";
import type { UpdateReservationStatusInput } from "../types";

import {
  InvalidReservationTransition,
  ReservationMissingBike,
  ReservationNotFound,
  ReservationNotOwned,
} from "../domain-errors";
import { makeReservationRepository, ReservationRepository } from "../repository/reservation.repository";
import { mapReservationUniqueViolation } from "../repository/unique-violation";

export type ConfirmPendingReservationResult = {
  readonly reservation: ReservationRow;
  readonly bikeId: string;
};

export type ReservationService = {
  /**
   * EN: Get reservation by id (Option).
   * VI: Lấy reservation theo id (Option).
   */
  getById: (reservationId: string) => Effect.Effect<Option.Option<ReservationRow>>;

  /**
   * EN: List reservations for a user with filters + pagination.
   * VI: Danh sách reservation của user (có filter + phân trang).
   */
  listForUser: (
    userId: string,
    filter: ReservationFilter,
    pageReq: PageRequest<ReservationSortField>,
  ) => Effect.Effect<PageResult<ReservationRow>>;

  /**
   * EN: Returns the latest pending/active reservation for a user (Option).
   * VI: Lấy reservation pending/active mới nhất của user (Option).
   */
  getLatestPendingOrActiveForUser: (
    userId: string,
  ) => Effect.Effect<Option.Option<ReservationRow>>;

  /**
   * EN: Returns the latest pending/active reservation for a user within a transaction.
   * VI: Lấy reservation pending/active mới nhất của user trong transaction.
   */
  getLatestPendingOrActiveForUserInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    userId: string,
  ) => Effect.Effect<Option.Option<ReservationRow>>;
  /**
   * EN: Bulk-expire PENDING reservations whose endTime < now.
   * VI: Hết hạn hàng loạt reservation PENDING có endTime < now.
   */
  markExpiredNow: (now: Date) => Effect.Effect<number>;

  /**
   * EN: Update reservation status by id.
   * VI: Cập nhật status reservation theo id.
   */
  updateStatus: (
    input: UpdateReservationStatusInput,
  ) => Effect.Effect<ReservationRow, ReservationNotFound>;

  /**
   * EN: Confirm a PENDING reservation owned by the user (reservation-only update).
   * VI: Xác nhận reservation PENDING của user (chỉ update reservation).
   */
  confirmPendingInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: {
      readonly reservationId: string;
      readonly userId: string;
      readonly now: Date;
    },
  ) => Effect.Effect<
    ConfirmPendingReservationResult,
    | ReservationNotFound
    | ReservationNotOwned
    | ReservationMissingBike
    | InvalidReservationTransition
  >;

  /**
   * EN: Cancel a PENDING reservation owned by the user (reservation-only update).
   * VI: Hủy reservation PENDING của user (chỉ update reservation).
   */
  cancelPendingInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: {
      readonly reservationId: string;
      readonly userId: string;
      readonly now: Date;
    },
  ) => Effect.Effect<
    ReservationRow,
    | ReservationNotFound
    | ReservationNotOwned
    | InvalidReservationTransition
  >;

  /**
   * EN: Create a PENDING reservation hold (maps unique violation to BikeAlreadyReserved).
   * VI: Tạo reservation giữ xe (PENDING), map lỗi unique thành BikeAlreadyReserved.
   */
  reserveHoldInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: {
      readonly userId: string;
      readonly bikeId: string;
      readonly stationId: string;
      readonly reservationOption: ReservationRow["reservationOption"];
      readonly subscriptionId: string | null;
      readonly startTime: Date;
      readonly endTime: Date | null;
      readonly prepaid: ReservationRow["prepaid"];
    },
  ) => Effect.Effect<ReservationRow, BikeAlreadyReserved | ActiveReservationExists>;
};

function makeReservationService(
  repo: import("../repository/reservation.repository").ReservationRepo,
): ReservationService {
  return {
    getById: reservationId =>
      repo.findById(reservationId).pipe(
        Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
      ),

    listForUser: (userId, filter, pageReq) =>
      repo.listForUser(userId, filter, pageReq).pipe(
        Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
      ),

    getLatestPendingOrActiveForUser: userId =>
      repo.findLatestPendingOrActiveByUserId(userId).pipe(
        Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
      ),

    getLatestPendingOrActiveForUserInTx: (tx, userId) =>
      makeReservationRepository(tx).findLatestPendingOrActiveByUserId(userId).pipe(
        Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
      ),

    markExpiredNow: now =>
      repo.markExpiredNow(now).pipe(
        Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
      ),

    updateStatus: input =>
      repo.updateStatus(input).pipe(
        Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
      ),

    confirmPendingInTx: (tx, input) =>
      Effect.gen(function* () {
        const txRepo = makeReservationRepository(tx);
        const reservationOpt = yield* txRepo.findById(input.reservationId).pipe(
          Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
        );
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
            to: "ACTIVE",
          }));
        }

        if (reservation.endTime && reservation.endTime <= input.now) {
          return yield* Effect.fail(new InvalidReservationTransition({
            reservationId: reservation.id,
            from: reservation.status,
            to: "ACTIVE",
          }));
        }

        if (!reservation.bikeId) {
          return yield* Effect.fail(new ReservationMissingBike({ reservationId: reservation.id }));
        }

        const updatedReservation = yield* txRepo.updateStatus({
          reservationId: reservation.id,
          status: "ACTIVE",
          updatedAt: input.now,
        }).pipe(
          Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
        );

        return {
          reservation: updatedReservation,
          bikeId: reservation.bikeId,
        };
      }),

    cancelPendingInTx: (tx, input) =>
      Effect.gen(function* () {
        const txRepo = makeReservationRepository(tx);
        const reservationOpt = yield* txRepo.findById(input.reservationId).pipe(
          Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
        );
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

        return yield* txRepo.updateStatus({
          reservationId: reservation.id,
          status: "CANCELLED",
          updatedAt: input.now,
        }).pipe(
          Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
        );
      }),

    reserveHoldInTx: (tx, input) =>
      makeReservationRepository(tx).createReservation({
        userId: input.userId,
        bikeId: input.bikeId,
        stationId: input.stationId,
        reservationOption: input.reservationOption,
        subscriptionId: input.subscriptionId,
        startTime: input.startTime,
        endTime: input.endTime,
        prepaid: input.prepaid,
        status: "PENDING",
      }).pipe(
        Effect.catchTag(
          "ReservationUniqueViolation",
          ({ constraint }): Effect.Effect<never, BikeAlreadyReserved | ActiveReservationExists> => {
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
        Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
      ),
  };
}

const makeReservationServiceEffect = Effect.gen(function* () {
  const repo = yield* ReservationRepository;
  return makeReservationService(repo);
});

export class ReservationServiceTag extends Effect.Service<ReservationServiceTag>()(
  "ReservationService",
  {
    effect: makeReservationServiceEffect,
  },
) {}

export const ReservationServiceLive = Layer.effect(
  ReservationServiceTag,
  makeReservationServiceEffect.pipe(Effect.map(ReservationServiceTag.make)),
);
