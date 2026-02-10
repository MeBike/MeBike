import type { RentalCountsRow, RentalStatusCounts } from "../models";

export function aggregateRentalStatusCounts(
  rows: readonly RentalCountsRow[],
): RentalStatusCounts {
  const counts: RentalStatusCounts = {
    RENTED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    RESERVED: 0,
  };

  for (const row of rows) {
    counts[row.status] = row.count;
  }

  return counts;
}
