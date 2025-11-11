type FormatOptions = {
  includeSeconds?: boolean;
};

export function formatVietnamDateTime(
  dateString: string,
  options: FormatOptions = {}
): string {
  if (!dateString) return "--";

  const [datePart, rawTimePart] = dateString.split("T");
  if (!datePart || !rawTimePart) return dateString;

  const [year, month, day] = datePart.split("-");
  const normalizedDate =
    day && month && year ? `${day}/${month}/${year}` : datePart;
  const timeWithoutZone = rawTimePart
    .replace(/Z$/i, "")
    .replace(/[+-]\d{2}:?\d{2}$/i, "");
  const [timeWithoutMs] = timeWithoutZone.split(".");

  if (!timeWithoutMs) return normalizedDate;

  const [hour = "00", minute = "00", second = "00"] = timeWithoutMs.split(":");
  const includeSeconds = options.includeSeconds ?? false;
  const formattedTime = includeSeconds
    ? `${hour}:${minute}:${second}`
    : `${hour}:${minute}`;

  return `${normalizedDate} ${formattedTime}`;
}
