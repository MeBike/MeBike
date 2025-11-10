import type { SubscriptionPackage } from "@/types/subscription-types";

export type SubscriptionPackageInfo = {
  id: SubscriptionPackage;
  title: string;
  price: number;
  monthlyLimit: number | null;
  accent: string;
  gradient: [string, string];
  description: string;
};

export const SUBSCRIPTION_PACKAGES: Record<SubscriptionPackage, SubscriptionPackageInfo> = {
  basic: {
    id: "basic",
    title: "Gói Cơ Bản",
    price: 99000,
    monthlyLimit: 30,
    accent: "#2563EB",
    gradient: ["#2563EB", "#38BDF8"],
    description: "Tối ưu cho nhu cầu di chuyển nhẹ nhàng hằng ngày.",
  },
  premium: {
    id: "premium",
    title: "Gói Nâng Cao",
    price: 199000,
    monthlyLimit: 60,
    accent: "#9333EA",
    gradient: ["#9333EA", "#F472B6"],
    description: "Phù hợp cho người dùng thường xuyên cần linh hoạt.",
  },
  unlimited: {
    id: "unlimited",
    title: "Gói Không Giới Hạn",
    price: 299000,
    monthlyLimit: null,
    accent: "#16A34A",
    gradient: ["#16A34A", "#4ADE80"],
    description: "Trải nghiệm cao cấp nhất cho người dùng trung thành.",
  },
};
