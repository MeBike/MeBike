import type { SubscriptionRecord } from "@/types/subscription-types";

import type { SubscriptionDataNode } from "../api/subscription.types";

const statusMap: Record<string, SubscriptionRecord["status"]> = {
  Pending: "ĐANG CHỜ XỬ LÍ",
  Active: "ĐANG HOẠT ĐỘNG",
  Expired: "ĐÃ HẾT HẠN",
  Cancelled: "ĐÃ HUỶ",
};

export function mapSubscriptionDataToRecord(node: SubscriptionDataNode): SubscriptionRecord {
  const pkg = node.package;
  return {
    _id: node.id,
    packageId: pkg?.id,
    package_name: pkg?.name ?? "unknown",
    activated_at: node.activatedAt ?? null,
    expires_at: node.expiredAt ?? null,
    max_usages: pkg?.maxUsages ?? null,
    usage_count: node.usageCounts ?? 0,
    price: Number(pkg?.price ?? 0),
    status: statusMap[node.status] ?? "ĐANG CHỜ XỬ LÍ",
    user: {
      fullname: "",
      email: "",
    },
  };
}
