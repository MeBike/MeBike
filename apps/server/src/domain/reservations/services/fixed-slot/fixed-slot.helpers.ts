import type {
  FixedSlotAssignmentOutcome,
  FixedSlotCounts,
  FixedSlotLabels,
} from "./fixed-slot.types";

export function toSlotDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseSlotDateKey(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Invalid slot date format: ${value}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}

export function normalizeSlotDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function mergeSlotStart(slotDate: Date, slotStart: Date): Date {
  return new Date(Date.UTC(
    slotDate.getUTCFullYear(),
    slotDate.getUTCMonth(),
    slotDate.getUTCDate(),
    slotStart.getUTCHours(),
    slotStart.getUTCMinutes(),
    0,
    0,
  ));
}

function formatSlotTimeLabel(slotStart: Date): string {
  const hours = String(slotStart.getUTCHours()).padStart(2, "0");
  const minutes = String(slotStart.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatSlotDateLabel(slotDate: Date): string {
  const day = String(slotDate.getUTCDate()).padStart(2, "0");
  const month = String(slotDate.getUTCMonth() + 1).padStart(2, "0");
  const year = slotDate.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function buildFixedSlotLabels(
  slotDate: Date,
  slotStart: Date,
): FixedSlotLabels {
  return {
    slotStartAt: mergeSlotStart(slotDate, slotStart),
    slotDateLabel: formatSlotDateLabel(slotDate),
    slotTimeLabel: formatSlotTimeLabel(slotStart),
  };
}

export function incrementFixedSlotCounts(
  counts: FixedSlotCounts,
  outcome: FixedSlotAssignmentOutcome,
) {
  switch (outcome) {
    case "ASSIGNED":
      counts.assigned += 1;
      break;
    case "NO_BIKE":
      counts.noBike += 1;
      break;
    case "MISSING_RESERVATION":
      counts.missingReservation += 1;
      break;
    case "CONFLICT":
      counts.conflicts += 1;
      break;
    default: {
      const _exhaustive: never = outcome;
      throw _exhaustive;
    }
  }
}
