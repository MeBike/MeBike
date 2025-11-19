export function formatRevenue(value: string | number | undefined) {
  if (!value && value !== 0) return "";

  const num = Number(value);
  return num >= 1_000_000
    ? `${(num / 1_000_000).toFixed(1)}M VND`
    : `${num.toLocaleString("vi-VN")} VND`;
}
