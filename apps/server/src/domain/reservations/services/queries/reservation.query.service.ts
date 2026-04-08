import type { ReservationQueryRepo } from "../../repository/reservation-query.repository";
import type { ReservationQueryService } from "../reservation.service.types";

import { makeReservationQueryRepository } from "../../repository/reservation-query.repository";

export function makeReservationQueryService(
  repo: ReservationQueryRepo,
): ReservationQueryService {
  return {
    getById: reservationId => repo.findById(reservationId),
    getExpandedDetailById: reservationId => repo.findExpandedDetailById(reservationId),
    listForUser: (userId, filter, pageReq) => repo.listForUser(userId, filter, pageReq),
    listForAdmin: (filter, pageReq) => repo.listForAdmin(filter, pageReq),
    getLatestPendingOrActiveForUser: userId => repo.findLatestPendingOrActiveByUserId(userId),
    getLatestPendingOrActiveForUserInTx: (tx, userId) =>
      makeReservationQueryRepository(tx).findLatestPendingOrActiveByUserId(userId),
    getCurrentHoldForUserNow: (userId, now) => repo.findPendingHoldByUserIdNow(userId, now),
    getCurrentHoldForUserNowInTx: (tx, userId, now) =>
      makeReservationQueryRepository(tx).findPendingHoldByUserIdNow(userId, now),
    getCurrentHoldForBikeNow: (bikeId, now) => repo.findPendingHoldByBikeIdNow(bikeId, now),
    getCurrentHoldForBikeNowInTx: (tx, bikeId, now) =>
      makeReservationQueryRepository(tx).findPendingHoldByBikeIdNow(bikeId, now),
  };
}
