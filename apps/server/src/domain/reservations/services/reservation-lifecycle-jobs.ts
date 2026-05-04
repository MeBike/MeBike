import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import { Effect } from "effect";

import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { env } from "@/config/env";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";

import type { ReservationRow } from "../models";

/**
 * Enqueue jobs nhac sap het han va auto-expire cho reservation hold.
 *
 * @param tx Transaction client dang dung.
 * @param reservation Reservation vua duoc tao hoac da co hold window cu the.
 * @param now Moc hien tai de clamp lich chay job.
 */
export function scheduleReservationLifecycleJobsInTx(
  tx: PrismaTypes.TransactionClient,
  reservation: ReservationRow,
  now: Date,
): Effect.Effect<void> {
  return Effect.gen(function* () {
    if (!reservation.endTime) {
      return;
    }

    const notifyAtMs = reservation.endTime.getTime()
      - env.EXPIRY_NOTIFY_MINUTES * 60 * 1000;
    const notifyAt = new Date(Math.max(now.getTime(), notifyAtMs));
    const expireAt = new Date(Math.max(now.getTime(), reservation.endTime.getTime()));

    yield* enqueueOutboxJobInTx(tx, {
      type: JobTypes.ReservationNotifyNearExpiry,
      payload: {
        version: 1,
        reservationId: reservation.id,
      },
      runAt: notifyAt,
      dedupeKey: `reservation:notify:${reservation.id}`,
    });

    yield* enqueueOutboxJobInTx(tx, {
      type: JobTypes.ReservationExpireHold,
      payload: {
        version: 1,
        reservationId: reservation.id,
      },
      runAt: expireAt,
      dedupeKey: `reservation:expire:${reservation.id}`,
    });
  });
}
