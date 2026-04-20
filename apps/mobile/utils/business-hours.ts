const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const OVERNIGHT_WINDOW_START_HOUR = 23;
const OVERNIGHT_WINDOW_END_HOUR = 5;

type TimeParts = {
  readonly hour: number;
  readonly minute: number;
};

function getTimePartsInTimeZone(
  date: Date,
  timeZone: string = VIETNAM_TIME_ZONE,
): TimeParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);

  return {
    hour: Number(parts.find(part => part.type === "hour")?.value ?? "0"),
    minute: Number(parts.find(part => part.type === "minute")?.value ?? "0"),
  };
}

function isWithinOvernightWindow(parts: TimeParts): boolean {
  return parts.hour >= OVERNIGHT_WINDOW_START_HOUR || parts.hour < OVERNIGHT_WINDOW_END_HOUR;
}

export function isWithinVietnamOvernightOperationsWindow(date: Date): boolean {
  return isWithinOvernightWindow(getTimePartsInTimeZone(date));
}

export function isWallClockWithinOvernightOperationsWindow(date: Date): boolean {
  return isWithinOvernightWindow({
    hour: date.getHours(),
    minute: date.getMinutes(),
  });
}

export function parseTimeStringToWallClockDate(value: string): Date {
  const [hoursString, minutesString] = value.split(":");
  const hours = Number.parseInt(hoursString ?? "0", 10);
  const minutes = Number.parseInt(minutesString ?? "0", 10);
  const date = new Date();

  date.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return date;
}

export function getOvernightOperationsClosedMessage(): string {
  return "Hệ thống tạm ngưng thao tác này từ 23:00 đến 05:00 giờ Việt Nam. Vui lòng thử lại sau 05:00.";
}

export function getFixedSlotOperatingHoursMessage(): string {
  return "Khung giờ cố định chỉ được bắt đầu từ 05:00 đến trước 23:00 giờ Việt Nam.";
}
