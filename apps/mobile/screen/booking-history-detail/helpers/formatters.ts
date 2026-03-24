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

export function getDisplayDurationMinutes(args: {
  status?: string;
  startTime?: string;
  duration?: number;
  now?: number;
}) {
  const { status, startTime, duration, now = Date.now() } = args;

  if (status !== "RENTED") {
    return Math.max(0, Math.floor(duration ?? 0));
  }

  if (!startTime) {
    return Math.max(0, Math.floor(duration ?? 0));
  }

  const startedAt = new Date(startTime).getTime();
  if (Number.isNaN(startedAt)) {
    return Math.max(0, Math.floor(duration ?? 0));
  }

  return Math.max(0, Math.floor((now - startedAt) / 60000));
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

export function getDepositStatusLabel(status?: string) {
  switch (status) {
    case "HELD": {
      return "Đang tạm giữ ";
    }
    case "RELEASED": {
      return "Đã hoàn";
    }
    case "FORFEITED": {
      return "Đã khấu trừ";
    }
    default: {
      return "Không áp dụng";
    }
  }
}

export function getDepositStatusTone(status?: string): "muted" | "warning" | "success" | "danger" {
  switch (status) {
    case "HELD": {
      return "warning";
    }
    case "RELEASED": {
      return "success";
    }
    case "FORFEITED": {
      return "danger";
    }
    default: {
      return "muted";
    }
  }
}

export function getDepositDescription(status?: string) {
  switch (status) {
    case "HELD": {
      return "Khoản cọc sẽ được hoàn lại khi bạn trả xe đúng quy định.";
    }
    case "RELEASED": {
      return "Khoản cọc cho chuyến đi này đã được hoàn về ví của bạn.";
    }
    case "FORFEITED": {
      return "Khoản cọc đã bị khấu trừ do chuyến đi phát sinh điều kiện giữ cọc.";
    }
    default: {
      return "Chuyến đi này không có thông tin cọc khả dụng.";
    }
  }
}

export function getRentalCodeLabel(rentalId: string) {
  return formatSupportCode(rentalId);
}
