type FormatOptions = {
  includeSeconds?: boolean;
};

export function formatVietnamDateTime(
  dateString: string,
  options: FormatOptions = {},
): string {
  const includeSeconds = options.includeSeconds ?? false;
  if (!dateString)
    return "--";

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime()))
    return dateString;

  const formatter = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" } : {}),
    hour12: false,
  });

  return formatter.format(parsed);
}
