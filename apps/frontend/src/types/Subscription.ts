export type SubscriptionStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
export interface Subscription {
  id: string;
  userId: string;
  packageName: string;
  maxUsages: number;
  usageCount: number;
  status: SubscriptionStatus;
  activatedAt: string;
  expiresAt: string;
  price: string;
  updatedAt: string;
  user : {
    id : string;
    fullName : string;
    email : string;
  }
}
