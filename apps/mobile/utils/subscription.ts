import type {
  DecimalValue,
  SubscriptionRecord,
  SubscriptionStatus,
} from "@/types/subscription-types";

const STATUS_COLORS: Record<
  SubscriptionStatus,
  { text: string; background: string }
> = {
  "ĐANG CHỜ XỬ LÍ": { text: "#B45309", background: "#FEF3C7" },
  "ĐANG HOẠT ĐỘNG": { text: "#15803D", background: "#DCFCE7" },
  "ĐÃ HẾT HẠN": { text: "#555", background: "#E5E7EB" },
  "ĐÃ HUỶ": { text: "#9B1C1C", background: "#FEE2E2" },
};

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} đ`;
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

export function parseDecimal(value: DecimalValue): number {
  if (typeof value === "number")
    return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function getStatusStyle(status: SubscriptionStatus) {
  return STATUS_COLORS[status];
}

export function extractLatestSubscription(
  subscriptions: SubscriptionRecord[],
): SubscriptionRecord | null {
  if (!subscriptions.length)
    return null;
  return subscriptions.reduce((latest, current) => {
    if (!latest)
      return current;
    const latestTime = new Date(latest.created_at ?? 0).getTime();
    const currentTime = new Date(current.created_at ?? 0).getTime();
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
