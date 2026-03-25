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
