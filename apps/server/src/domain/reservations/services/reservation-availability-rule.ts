import { Effect } from "effect";

import type { Prisma as PrismaTypes } from "generated/prisma/client";

export function requiredAvailableBikesForReservation(totalCapacity: number): number {
  return Math.floor(totalCapacity / 2) + 1;
}

export function stationCanAcceptReservation(args: {
  totalCapacity: number;
  availableBikes: number;
}): boolean {
  return args.availableBikes >= requiredAvailableBikesForReservation(args.totalCapacity);
}

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
