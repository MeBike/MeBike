import { Effect } from "effect";

import type { Prisma as PrismaTypes } from "generated/prisma/client";

/**
 * Tinh so luong reservation pickup toi da cho pool xe kha dung ban dau.
 *
 * Rule theo spec: chi toi da mot nua so xe AVAILABLE duoc phep dat truoc.
 *
 * @param availableBikePool Tong so xe AVAILABLE ban dau, tinh ca xe da bi giu boi pending reservation.
 * @returns So reservation pickup toi da duoc phep ton tai cung luc.
 */
export function maxReservableBikesForAvailablePool(availableBikePool: number): number {
  return Math.floor(availableBikePool / 2);
}

/**
 * Tinh so xe AVAILABLE toi thieu can co de tao them mot reservation.
 *
 * @param pendingReservations So pending reservation hien tai tai tram.
 * @returns So xe AVAILABLE toi thieu de pendingReservations + 1 khong vuot qua cap.
 */
export function requiredAvailableBikesForNextReservation(pendingReservations: number): number {
  return pendingReservations + 2;
}

/**
 * Kiem tra tram con du dieu kien tao reservation moi hay khong.
 *
 * @param args So xe AVAILABLE hien tai va so reservation dang giu xe tai tram.
 * @param args.availableBikes So xe AVAILABLE hien tai.
 * @param args.pendingReservations So pending reservation hien tai tai tram.
 * @returns `true` neu tao them reservation khong vuot qua mot nua pool xe kha dung.
 */
export function stationCanAcceptReservation(args: {
  availableBikes: number;
  pendingReservations: number;
}): boolean {
  const availableBikePool = args.availableBikes + args.pendingReservations;
  return args.pendingReservations < maxReservableBikesForAvailablePool(availableBikePool);
}

/**
 * Khoa row Station trong transaction hien tai de serialize availability check.
 *
 * @param tx Prisma transaction client dang su dung.
 * @param stationId ID tram can khoa.
 * @returns Effect hoan tat khi row lock da duoc giu.
 */
export function lockStationForReservationCheck(
  tx: PrismaTypes.TransactionClient,
  stationId: string,
) {
  return Effect.tryPromise({
    try: () =>
      tx.$queryRaw`
        SELECT id
        FROM "Station"
        WHERE id = ${stationId}::uuid
        FOR UPDATE
      `,
    catch: cause => cause,
  }).pipe(
    Effect.orDie,
    Effect.asVoid,
  );
}
