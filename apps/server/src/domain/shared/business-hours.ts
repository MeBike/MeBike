import { Data } from "effect";

export const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh" as const;
export const OVERNIGHT_OPERATIONS_WINDOW_START_LABEL = "23:00" as const;
export const OVERNIGHT_OPERATIONS_WINDOW_END_LABEL = "05:00" as const;

const OVERNIGHT_WINDOW_START = { hour: 23, minute: 0, second: 0 } as const;
const OVERNIGHT_WINDOW_END = { hour: 5, minute: 0, second: 0 } as const;

type TimeParts = {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
};

type DateTimeParts = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
} & TimeParts;

function compareTimeParts(left: TimeParts, right: TimeParts) {
  if (left.hour !== right.hour) {
    return left.hour - right.hour;
  }

  if (left.minute !== right.minute) {
    return left.minute - right.minute;
  }

  return left.second - right.second;
}

function isWithinOvernightWindowByClock(time: TimeParts): boolean {
  return compareTimeParts(time, OVERNIGHT_WINDOW_START) >= 0
    || compareTimeParts(time, OVERNIGHT_WINDOW_END) < 0;
}

/**
 * Lay gio/phut/giay cua mot moc thoi gian theo Vietnam time.
 */
export function getTimePartsInTimeZone(
  date: Date,
  timeZone: string = VIETNAM_TIME_ZONE,
): TimeParts {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  return {
    hour: Number(parts.find(part => part.type === "hour")?.value ?? "0"),
    minute: Number(parts.find(part => part.type === "minute")?.value ?? "0"),
    second: Number(parts.find(part => part.type === "second")?.value ?? "0"),
  };
}

function getDateTimePartsInTimeZone(
  date: Date,
  timeZone: string = VIETNAM_TIME_ZONE,
): DateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  return {
    year: Number(parts.find(part => part.type === "year")?.value ?? "0"),
    month: Number(parts.find(part => part.type === "month")?.value ?? "0"),
    day: Number(parts.find(part => part.type === "day")?.value ?? "0"),
    hour: Number(parts.find(part => part.type === "hour")?.value ?? "0"),
    minute: Number(parts.find(part => part.type === "minute")?.value ?? "0"),
    second: Number(parts.find(part => part.type === "second")?.value ?? "0"),
  };
}

export function formatVietnamDateTime(date: Date): string {
  const parts = getDateTimePartsInTimeZone(date);

  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}:${String(parts.second).padStart(2, "0")}+07:00`;
}

/**
 * Kiem tra mot moc thoi gian thuc co nam trong khung dong ban dem khong.
 * Khung dong: tu 23:00:00 den 04:59:59.
 */
export function isWithinOvernightOperationsWindow(
  date: Date,
  timeZone: string = VIETNAM_TIME_ZONE,
): boolean {
  return isWithinOvernightWindowByClock(getTimePartsInTimeZone(date, timeZone));
}

/**
 * Kiem tra wall-clock time luu trong Date UTC placeholder co nam trong khung dong khong.
 */
export function isWallClockWithinOvernightOperationsWindow(date: Date): boolean {
  return isWithinOvernightWindowByClock({
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  });
}

export class OvernightOperationsClosed extends Data.TaggedError(
  "OvernightOperationsClosed",
)<{
    readonly currentTime: string;
    readonly timeZone: string;
    readonly windowStart: string;
    readonly windowEnd: string;
  }> {}

export class FixedSlotTemplateStartOutsideOperatingHours extends Data.TaggedError(
  "FixedSlotTemplateStartOutsideOperatingHours",
)<{
    readonly slotStart: string;
    readonly windowStart: string;
    readonly windowEnd: string;
  }> {}

export function makeOvernightOperationsClosedError(now: Date): OvernightOperationsClosed {
  return new OvernightOperationsClosed({
    currentTime: formatVietnamDateTime(now),
    timeZone: VIETNAM_TIME_ZONE,
    windowStart: OVERNIGHT_OPERATIONS_WINDOW_START_LABEL,
    windowEnd: OVERNIGHT_OPERATIONS_WINDOW_END_LABEL,
  });
}

export function makeFixedSlotTemplateStartOutsideOperatingHoursError(
  slotStart: Date,
): FixedSlotTemplateStartOutsideOperatingHours {
  return new FixedSlotTemplateStartOutsideOperatingHours({
    slotStart: `${String(slotStart.getUTCHours()).padStart(2, "0")}:${String(slotStart.getUTCMinutes()).padStart(2, "0")}`,
    windowStart: OVERNIGHT_OPERATIONS_WINDOW_START_LABEL,
    windowEnd: OVERNIGHT_OPERATIONS_WINDOW_END_LABEL,
  });
}
