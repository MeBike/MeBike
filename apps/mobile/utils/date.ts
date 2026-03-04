type FormatOptions = {
  includeSeconds?: boolean;
};

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

export function formatVietnamDateTime(
  dateString: string,
  options: FormatOptions = {},
): string {
  if (!dateString)
    return "--";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime()))
    return dateString;

  const includeSeconds = options.includeSeconds ?? false;

  const formatter = new Intl.DateTimeFormat("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: includeSeconds ? "2-digit" : undefined,
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const day = parts.find(part => part.type === "day")?.value ?? "--";
  const month = parts.find(part => part.type === "month")?.value ?? "--";
  const year = parts.find(part => part.type === "year")?.value ?? "----";
  const hour = parts.find(part => part.type === "hour")?.value ?? "00";
  const minute = parts.find(part => part.type === "minute")?.value ?? "00";
  const second = includeSeconds
    ? (parts.find(part => part.type === "second")?.value ?? "00")
    : undefined;

  const formattedTime = second ? `${hour}:${minute}:${second}` : `${hour}:${minute}`;

  return `${day}/${month}/${year} ${formattedTime}`;
}
