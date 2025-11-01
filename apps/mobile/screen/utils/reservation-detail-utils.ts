import type { Reservation } from "../../types/reservation-types";

export const statusColorMap: Record<Reservation["status"], string> = {
  "ĐANG CHỜ XỬ LÍ": "#FFB020",
  "ĐANG HOẠT ĐỘNG": "#4CAF50",
  "ĐÃ HUỶ": "#F44336",
  "ĐÃ HẾT HẠN": "#9E9E9E",
};

const SERVER_TIME_OFFSET_MS = 7 * 60 * 60 * 1000;

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "Không có dữ liệu";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Không có dữ liệu";
  }

  const compensatedDate = new Date(date.getTime() - SERVER_TIME_OFFSET_MS);

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(compensatedDate);
}

export function formatCurrency(
  value?: number | string | { $numberDecimal?: string },
): string {
  if (value === null || value === undefined) {
    return "0 đ";
  }
  let amount = 0;
  if (typeof value === "number") {
    amount = value;
  }
  else if (typeof value === "string") {
    const parsed = Number(value);
    amount = Number.isFinite(parsed) ? parsed : 0;
  }
  else if (typeof value === "object" && "$numberDecimal" in value) {
    const parsed = Number(value.$numberDecimal);
    amount = Number.isFinite(parsed) ? parsed : 0;
  }
  if (!Number.isFinite(amount)) {
    amount = 0;
  }
  return `${amount.toLocaleString("vi-VN")} đ`;
}
