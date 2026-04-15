import { Effect } from "effect";

import type { Prisma as PrismaTypes } from "generated/prisma/client";

/**
 * Tinh nguong xe AVAILABLE toi thieu de tram duoc phep nhan reservation moi.
 *
 * Rule theo spec: so xe kha dung phai lon hon 50% tong suc chua.
 *
 * @param totalCapacity Tong suc chua cua tram.
 * @returns So xe AVAILABLE toi thieu can co tai thoi diem kiem tra.
 */
export function requiredAvailableBikesForReservation(totalCapacity: number): number {
  return Math.floor(totalCapacity / 2) + 1;
}

/**
 * Kiem tra tram con du dieu kien tao reservation moi hay khong.
 *
 * @param args Tong suc chua va so xe AVAILABLE hien tai.
 * @param args.totalCapacity Tong suc chua cua tram.
 * @param args.availableBikes So xe AVAILABLE hien tai.
 * @returns `true` neu tram con vuot nguong availability cho reservation.
 */
export function stationCanAcceptReservation(args: {
  totalCapacity: number;
  availableBikes: number;
}): boolean {
  return args.availableBikes >= requiredAvailableBikesForReservation(args.totalCapacity);
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
