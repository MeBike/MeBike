import type { ReservationCountsRow, ReservationStatusCounts } from "../models";

export function aggregateReservationStatusCounts(
  rows: readonly ReservationCountsRow[],
): ReservationStatusCounts {
  const counts: ReservationStatusCounts = {
    PENDING: 0,
    FULFILLED: 0,
    CANCELLED: 0,
    EXPIRED: 0,
  };

  for (const row of rows) {
    counts[row.status] = row.count;
  }

  return counts;
}
