import { formatDurationMinutes } from "@utils/duration";
import { formatSupportCode } from "@utils/id";

export function formatRentalDuration(duration?: number) {
  return formatDurationMinutes(duration, { hasEnded: true, fallback: "0 phút" });
}

export function getDurationParts(duration?: number) {
  const totalMinutes = Math.max(0, Math.floor(duration ?? 0));
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

export function formatDateOnly(value?: string) {
  if (!value) {
    return "--/--/----";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatTimeOnly(value?: string) {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatCurrencyText(value?: number, subscriptionId?: string) {
  const total = value ?? 0;

  if (subscriptionId && total === 0) {
    return "0 đ (Gói tháng)";
  }

  return `${total.toLocaleString("vi-VN")} đ`;
}

export function getPaymentLabel(subscriptionId?: string) {
  return subscriptionId ? "Gói tháng" : "Ví MeBike";
}

export function getRentalCodeLabel(rentalId: string) {
  return formatSupportCode(rentalId);
}
