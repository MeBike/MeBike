const DEFAULT_TIME_ZONE = "Asia/Ho_Chi_Minh";

function getTimePartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  const hour = Number(parts.find(part => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find(part => part.type === "minute")?.value ?? "0");
  const second = Number(parts.find(part => part.type === "second")?.value ?? "0");

  return { hour, minute, second };
}

function getDateKeyInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const year = parts.find(part => part.type === "year")?.value ?? "0000";
  const month = parts.find(part => part.type === "month")?.value ?? "01";
  const day = parts.find(part => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

export function isAfterLateReturnCutoff(
  confirmedAt: Date,
  lateReturnCutoff: Date,
  timeZone = DEFAULT_TIME_ZONE,
): boolean {
  const confirmed = getTimePartsInTimeZone(confirmedAt, timeZone);
  const cutoff = {
    hour: lateReturnCutoff.getUTCHours(),
    minute: lateReturnCutoff.getUTCMinutes(),
    second: lateReturnCutoff.getUTCSeconds(),
  };

  if (confirmed.hour !== cutoff.hour) {
    return confirmed.hour > cutoff.hour;
  }

  if (confirmed.minute !== cutoff.minute) {
    return confirmed.minute > cutoff.minute;
  }

  return confirmed.second > cutoff.second;
}

export function isPastRentalReturnDeadline(
  rentalStartTime: Date,
  referenceTime: Date,
  lateReturnCutoff: Date,
  timeZone = DEFAULT_TIME_ZONE,
): boolean {
  const rentalDateKey = getDateKeyInTimeZone(rentalStartTime, timeZone);
  const referenceDateKey = getDateKeyInTimeZone(referenceTime, timeZone);

  if (referenceDateKey !== rentalDateKey) {
    return referenceDateKey > rentalDateKey;
  }

  return isAfterLateReturnCutoff(referenceTime, lateReturnCutoff, timeZone);
}
