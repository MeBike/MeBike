import type { Option } from "effect";

import { Effect, Layer } from "effect";

import type { ReservationRow } from "../models";

import { ReservationRepository } from "../repository/reservation.repository";

export type ReservationHoldService = {
  /**
   * EN: Returns the current hold for a user (PENDING + time window).
   * VI: Trả về "hold" hiện tại của user (PENDING + trong khung thời gian).
   */
  getCurrentHoldForUserNow: (
    userId: string,
    now: Date,
  ) => Effect.Effect<Option.Option<ReservationRow>>;

  /**
   * EN: Returns the current hold for a user within a transaction.
   * VI: Trả về "hold" hiện tại của user trong transaction.
   */
  getCurrentHoldForUserNowInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    userId: string,
    now: Date,
  ) => Effect.Effect<Option.Option<ReservationRow>>;

  /**
   * EN: Returns the current hold for a bike (PENDING + time window).
   * VI: Trả về "hold" hiện tại của xe (PENDING + trong khung thời gian).
   */
  getCurrentHoldForBikeNow: (
    bikeId: string,
    now: Date,
  ) => Effect.Effect<Option.Option<ReservationRow>>;

  /**
   * EN: Returns the current hold for a bike within a transaction.
   * VI: Trả về "hold" hiện tại của xe trong transaction.
   */
  getCurrentHoldForBikeNowInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    bikeId: string,
    now: Date,
  ) => Effect.Effect<Option.Option<ReservationRow>>;
};

function makeReservationHoldService(
  repo: import("../repository/reservation.repository").ReservationRepo,
): ReservationHoldService {
  return {
    getCurrentHoldForUserNow: (userId, now) =>
      repo.findPendingHoldByUserIdNow(userId, now).pipe(
        Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
      ),

    getCurrentHoldForUserNowInTx: (tx, userId, now) =>
      repo.findPendingHoldByUserIdNowInTx(tx, userId, now).pipe(
        Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
      ),

    getCurrentHoldForBikeNow: (bikeId, now) =>
      repo.findPendingHoldByBikeIdNow(bikeId, now).pipe(
        Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
      ),

    getCurrentHoldForBikeNowInTx: (tx, bikeId, now) =>
      repo.findPendingHoldByBikeIdNowInTx(tx, bikeId, now).pipe(
        Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
      ),
  };
}

const makeReservationHoldServiceEffect = Effect.gen(function* () {
  const repo = yield* ReservationRepository;
  return makeReservationHoldService(repo);
});

export class ReservationHoldServiceTag extends Effect.Service<ReservationHoldServiceTag>()(
  "ReservationHoldService",
  {
    effect: makeReservationHoldServiceEffect,
  },
) {}

export const ReservationHoldServiceLive = Layer.effect(
  ReservationHoldServiceTag,
  makeReservationHoldServiceEffect.pipe(Effect.map(ReservationHoldServiceTag.make)),
);
