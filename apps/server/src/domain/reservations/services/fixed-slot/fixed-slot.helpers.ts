import { fromZonedTime } from "date-fns-tz";

import type {
  FixedSlotAssignmentOutcome,
  FixedSlotCounts,
  FixedSlotLabels,
} from "./fixed-slot.types";

const FIXED_SLOT_TIME_ZONE = "Asia/Ho_Chi_Minh";

const businessDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: FIXED_SLOT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getBusinessDateParts(date: Date) {
  const parts = businessDateFormatter.formatToParts(date);

  return {
    year: parts.find(part => part.type === "year")?.value ?? "0000",
    month: parts.find(part => part.type === "month")?.value ?? "00",
    day: parts.find(part => part.type === "day")?.value ?? "00",
  };
}

/**
 * Chuyển một mốc thời gian thành key ngày fixed-slot theo múi giờ Việt Nam.
 *
 * @param date Mốc thời gian cần rút gọn thành key ngày.
 * @returns Chuỗi ngày `YYYY-MM-DD` theo lịch Việt Nam.
 */
export function toSlotDateKey(date: Date): string {
  const { year, month, day } = getBusinessDateParts(date);
  return `${year}-${month}-${day}`;
}

/**
 * Parse chuỗi ngày fixed-slot dạng `YYYY-MM-DD` thành token ngày.
 * Token này luôn neo tại `00:00:00.000Z` để lưu và truy vấn ổn định ở cột `DATE`.
 *
 * @param value Chuỗi ngày đầu vào.
 * @returns `Date` tại mốc `00:00:00.000Z` của đúng ngày literal đó.
 */
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

/**
 * Đưa một mốc thời gian bất kỳ về token ngày business của Việt Nam.
 *
 * @param date Mốc thời gian đầu vào.
 * @returns Token ngày fixed-slot tương ứng với lịch Việt Nam.
 */
export function normalizeSlotDate(date: Date): Date {
  return parseSlotDateKey(toSlotDateKey(date));
}

/**
 * Ghép ngày slot và giờ slot thành mốc bắt đầu reservation theo giờ Việt Nam,
 * rồi chuyển mốc đó về UTC để lưu trong database.
 *
 * @param slotDate Ngày slot đã normalize thành token ngày.
 * @param slotStart Giờ slot đang được lưu dưới dạng wall-clock `HH:mm`.
 * @returns Mốc thời gian UTC tương ứng với giờ Việt Nam mà user đã chọn.
 */
function mergeSlotStart(slotDate: Date, slotStart: Date): Date {
  const slotDateKey = toSlotDateKey(slotDate);
  const hours = String(slotStart.getUTCHours()).padStart(2, "0");
  const minutes = String(slotStart.getUTCMinutes()).padStart(2, "0");

  return fromZonedTime(
    `${slotDateKey}T${hours}:${minutes}:00.000`,
    FIXED_SLOT_TIME_ZONE,
  );
}

/**
 * Format gio slot thanh chuoi `HH:mm` theo UTC.
 *
 * @param slotStart Gio slot dang luu o dang UTC wall-clock.
 * @returns Chuoi gio dung cho email va API response.
 */
function formatSlotTimeLabel(slotStart: Date): string {
  const hours = String(slotStart.getUTCHours()).padStart(2, "0");
  const minutes = String(slotStart.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Hàm public để trả ra giờ slot ở dạng `HH:mm`.
 *
 * @param slotStart Gio slot can format.
 * @returns Chuoi gio `HH:mm`.
 */
export function formatSlotTimeValue(slotStart: Date): string {
  return formatSlotTimeLabel(slotStart);
}

/**
 * Parse chuoi gio `HH:mm` thanh `Date` UTC wall-clock.
 *
 * @param value Chuoi gio dau vao.
 * @returns `Date` moc gia tren ngay neo 2000-01-01 theo UTC.
 */
export function parseSlotTimeValue(value: string): Date {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    throw new Error(`Invalid slot time format: ${value}`);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return new Date(Date.UTC(2000, 0, 1, hours, minutes, 0, 0));
}

/**
 * Format ngày slot thành chuỗi để hiển thị trong email theo lịch Việt Nam.
 *
 * @param slotDate Ngay slot can hien thi.
 * @returns Chuoi ngay dang `DD/MM/YYYY`.
 */
function formatSlotDateLabel(slotDate: Date): string {
  const { day, month, year } = getBusinessDateParts(slotDate);
  return `${day}/${month}/${year}`;
}

/**
 * Tạo bộ label và timestamp cần dùng khi materialize reservation fixed-slot.
 *
 * @param slotDate Ngày slot đã chọn.
 * @param slotStart Giờ slot đã chọn.
 * @returns Bộ label và mốc `slotStartAt` dùng cho flow gán reservation.
 */
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

/**
 * Tăng bộ đếm tổng hợp theo kết quả assignment từng template.
 *
 * @param counts Bộ đếm đang được mutate.
 * @param outcome Kết quả assignment của một template.
 */
export function incrementFixedSlotCounts(
  counts: FixedSlotCounts,
  outcome: FixedSlotAssignmentOutcome,
) {
  switch (outcome) {
    case "ASSIGNED":
      counts.assigned += 1;
      break;
    case "ALREADY_ASSIGNED":
      counts.alreadyAssigned += 1;
      break;
    case "NO_BIKE":
      counts.noBike += 1;
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
