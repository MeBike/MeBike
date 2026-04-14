import type {
  FixedSlotAssignmentOutcome,
  FixedSlotCounts,
  FixedSlotLabels,
} from "./fixed-slot.types";

/**
 * Chuyen `Date` thanh key ngay fixed-slot dang `YYYY-MM-DD` theo UTC.
 *
 * @param date Moc thoi gian can rut gon thanh key ngay.
 * @returns Chuoi ngay dung de so sanh va truy van fixed-slot.
 */
export function toSlotDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse chuoi ngay fixed-slot dang `YYYY-MM-DD` thanh `Date` UTC midnight.
 *
 * @param value Chuoi ngay dau vao.
 * @returns `Date` tai moc 00:00:00.000Z cua ngay do.
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
 * Dua mot moc thoi gian bat ky ve UTC midnight cung ngay.
 *
 * @param date Moc thoi gian dau vao.
 * @returns `Date` da duoc normalize ve dau ngay theo UTC.
 */
export function normalizeSlotDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Ghep ngay slot va gio slot thanh moc bat dau reservation theo UTC.
 *
 * @param slotDate Ngay slot da normalize.
 * @param slotStart Gio slot dang duoc luu o dang UTC wall-clock.
 * @returns Moc bat dau reservation cho fixed-slot.
 */
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
 * Format ngay slot thanh chuoi de hien thi trong email.
 *
 * @param slotDate Ngay slot can hien thi.
 * @returns Chuoi ngay dang `DD/MM/YYYY`.
 */
function formatSlotDateLabel(slotDate: Date): string {
  const day = String(slotDate.getUTCDate()).padStart(2, "0");
  const month = String(slotDate.getUTCMonth() + 1).padStart(2, "0");
  const year = slotDate.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Tao bo label va timestamp can dung khi materialize reservation fixed-slot.
 *
 * @param slotDate Ngay slot da chon.
 * @param slotStart Gio slot da chon.
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
 * Tang bo dem tong hop theo ket qua assignment tung template.
 *
 * @param counts Bo dem dang duoc mutate.
 * @param outcome Ket qua assignment cua mot template.
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
