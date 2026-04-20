const DEFAULT_TIME_ZONE = "Asia/Ho_Chi_Minh";

/**
 * Helper late-return tập trung cho business rule cutoff theo giờ Việt Nam.
 *
 * Pricing policy chỉ lưu `lateReturnCutoff` như một mốc giờ-phút-giây kiểu wall-clock
 * (ví dụ 23:00:00), không phải một deadline tuyệt đối theo ngày cụ thể.
 * File này chịu trách nhiệm so sánh `Date` thực tế với cutoff đó theo timezone business,
 * để mọi nơi dùng chung một cách hiểu.
 */

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

function compareTimeParts(
  left: { hour: number; minute: number; second: number },
  right: { hour: number; minute: number; second: number },
): number {
  if (left.hour !== right.hour) {
    return left.hour - right.hour;
  }

  if (left.minute !== right.minute) {
    return left.minute - right.minute;
  }

  return left.second - right.second;
}

function getCutoffTimeParts(lateReturnCutoff: Date) {
  return {
    hour: lateReturnCutoff.getUTCHours(),
    minute: lateReturnCutoff.getUTCMinutes(),
    second: lateReturnCutoff.getUTCSeconds(),
  };
}

export function isAfterLateReturnCutoff(
  confirmedAt: Date,
  lateReturnCutoff: Date,
  timeZone = DEFAULT_TIME_ZONE,
): boolean {
  const confirmed = getTimePartsInTimeZone(confirmedAt, timeZone);
  const cutoff = getCutoffTimeParts(lateReturnCutoff);

  return compareTimeParts(confirmed, cutoff) > 0;
}

/**
 * Dùng cho rule overdue/lost tại đúng thời điểm cutoff.
 *
 * Khác với `isAfterLateReturnCutoff`, helper này coi đúng 23:00:00 là đã chạm cutoff.
 * Nhờ đó worker sweep không bị lệch 1 nhịp giữa việc huỷ return-slot và mark overdue.
 */
export function isAtOrAfterLateReturnCutoff(
  referenceTime: Date,
  lateReturnCutoff: Date,
  timeZone = DEFAULT_TIME_ZONE,
): boolean {
  const reference = getTimePartsInTimeZone(referenceTime, timeZone);
  const cutoff = getCutoffTimeParts(lateReturnCutoff);

  return compareTimeParts(reference, cutoff) >= 0;
}

/**
 * Kiểm tra rental đã quá hạn trả xe chưa theo ngày business ở Việt Nam.
 *
 * Rule hiện tại:
 * - Sang ngày business tiếp theo: luôn quá hạn.
 * - Cùng ngày business: quá hạn ngay khi chạm hoặc vượt cutoff.
 */
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

  return isAtOrAfterLateReturnCutoff(referenceTime, lateReturnCutoff, timeZone);
}
