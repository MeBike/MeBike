import type { FixedSlotTemplatesContracts } from "@mebike/shared";

import type { FixedSlotTemplateRow } from "@/domain/reservations";

import {
  formatSlotTimeValue,
  toSlotDateKey,
} from "@/domain/reservations";

export function toFixedSlotTemplate(
  row: FixedSlotTemplateRow,
): FixedSlotTemplatesContracts.FixedSlotTemplate {
  return {
    id: row.id,
    userId: row.userId,
    station: {
      id: row.station.id,
      name: row.station.name,
      address: row.station.address,
    },
    slotStart: formatSlotTimeValue(row.slotStart),
    slotDates: row.slotDates.map(toSlotDateKey),
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
  };
}
