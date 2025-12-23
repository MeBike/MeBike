import { endOfDay, endOfMonth, getDate, set, startOfMonth, subMonths } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const UTC_TZ = "UTC";

function toUtc(date: Date): Date {
  return fromZonedTime(date, UTC_TZ);
}

export function computeMonthRange(now: Date): {
  readonly monthStart: Date;
  readonly monthEnd: Date;
} {
  const utcNow = toZonedTime(now, UTC_TZ);

  // First day of current month at 00:00 UTC
  const monthStart = toUtc(startOfMonth(utcNow));

  // End of the range is the passed-in `now` instant (Date is UTC-based; cloning preserves the instant).
  const monthEnd = new Date(now.getTime());

  return { monthStart, monthEnd };
}

export function computeNewUsersRanges(now: Date): {
  readonly thisMonthStart: Date;
  readonly thisMonthEnd: Date;
  readonly lastMonthStart: Date;
  readonly lastMonthEnd: Date;
} {
  const utcNow = toZonedTime(now, UTC_TZ);
  const dayOfMonth = getDate(utcNow);

  // This month: 1st day at 00:00 UTC to now
  const thisMonthStart = toUtc(startOfMonth(utcNow));
  const thisMonthEnd = new Date(now.getTime());

  // Last month: 1st day at 00:00 UTC to same day-of-month (capped to last day)
  const lastMonthBase = subMonths(utcNow, 1);
  const lastMonthStart = toUtc(startOfMonth(lastMonthBase));

  // Cap to last day of previous month
  const daysInLastMonth = getDate(endOfMonth(lastMonthBase));
  const cappedDay = Math.min(dayOfMonth, daysInLastMonth);

  // End of day on the capped day (UTC)
  const lastMonthEnd = toUtc(endOfDay(set(lastMonthBase, { date: cappedDay })));

  return {
    thisMonthStart,
    thisMonthEnd,
    lastMonthStart,
    lastMonthEnd,
  };
}
