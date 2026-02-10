import type { Subscription, SubscriptionStatus } from "@/types/subscription-types";

const STATUS_COLORS: Record<SubscriptionStatus, { text: string; background: string }> = {
  PENDING: { text: "#B45309", background: "#FEF3C7" },
  ACTIVE: { text: "#15803D", background: "#DCFCE7" },
  EXPIRED: { text: "#555", background: "#E5E7EB" },
  CANCELLED: { text: "#9B1C1C", background: "#FEE2E2" },
};

export function toSubscriptionStatusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case "PENDING":
      return "ĐANG CHỜ XỬ LÍ";
    case "ACTIVE":
      return "ĐANG HOẠT ĐỘNG";
    case "EXPIRED":
      return "ĐÃ HẾT HẠN";
    case "CANCELLED":
      return "ĐÃ HUỶ";
  }
}

export function formatCurrency(amount: string | number): string {
  const value = typeof amount === "number" ? amount : Number(amount);
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toLocaleString("vi-VN")} đ`;
}

export function formatDate(date?: string | null): string {
  if (!date)
    return "-";
  const [datePart] = date.split("T");
  if (!datePart)
    return "-";
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day)
    return datePart;
  return `${day}/${month}/${year}`;
}

export function getStatusStyle(status: SubscriptionStatus) {
  return STATUS_COLORS[status];
}

export function extractLatestSubscription(subscriptions: Subscription[]): Subscription | null {
  if (!subscriptions.length) return null;
  return subscriptions.reduce((latest, current) => {
    if (!latest) return current;
    const latestTime = new Date(latest.updatedAt).getTime();
    const currentTime = new Date(current.updatedAt).getTime();
    return currentTime > latestTime ? current : latest;
  }, subscriptions[0]);
}

export function formatDateUTC(isoString: string) {
  const date = new Date(isoString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
}
