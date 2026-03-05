type FormatDurationOptions = {
  hasEnded?: boolean;
  fallback?: string;
};

export function formatDurationMinutes(
  durationMinutes?: number,
  options: FormatDurationOptions = {},
): string {
  if (!durationMinutes || durationMinutes <= 0) {
    if (options.hasEnded === false) {
      return "Chưa kết thúc";
    }
    if (options.hasEnded === true) {
      return "0 phút";
    }
    return options.fallback ?? "--";
  }

  const totalMinutes = Math.floor(durationMinutes);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} giờ ${minutes} phút`;
  }
  if (hours > 0) {
    return `${hours} giờ`;
  }
  return `${minutes} phút`;
}
