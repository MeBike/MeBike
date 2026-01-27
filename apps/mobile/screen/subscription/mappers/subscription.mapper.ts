import type { SubscriptionGraphql } from "@/lib/schemas/subscription.schema";
import type { SubscriptionRecord } from "@/types/subscription-types";

const statusMap: Record<string, SubscriptionRecord["status"]> = {
  Pending: "ĐANG CHỜ XỬ LÍ",
  Active: "ĐANG HOẠT ĐỘNG",
  Expired: "ĐÃ HẾT HẠN",
  Cancelled: "ĐÃ HUỶ",
};

function normalizePrice(value: unknown) {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function mapSubscriptionDataToRecord(
  node: SubscriptionGraphql,
): SubscriptionRecord {
  const pkg = node.package;
  return {
    _id: node.id,
    packageId: pkg?.id,
    package_name: pkg?.name ?? "unknown",
    activated_at: node.activatedAt ?? null,
    expires_at: node.expiredAt ?? null,
    created_at: node.createdAt ?? undefined,
    updated_at: node.updatedAt ?? undefined,
    max_usages: pkg?.maxUsages ?? null,
    usage_count: node.usageCounts ?? 0,
    price: normalizePrice(pkg?.price),
    status: statusMap[node.status ?? ""] ?? "ĐANG CHỜ XỬ LÍ",
    user: {
      fullname: "",
      email: "",
    },
  };
}
