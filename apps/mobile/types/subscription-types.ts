export type SubscriptionStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";

export type SubscriptionPackage = "basic" | "premium" | "unlimited";

export type Subscription = {
  id: string;
  userId: string;
  packageName: SubscriptionPackage;
  maxUsages: number | null;
  usageCount: number;
  status: SubscriptionStatus;
  activatedAt: string | null;
  expiresAt: string | null;
  price: string; // minor unit string from server
  updatedAt: string;
};

export type SubscriptionPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SubscriptionListResponse = {
  data: Subscription[];
  pagination: SubscriptionPagination;
};

export type CreateSubscriptionPayload = {
  packageName: SubscriptionPackage;
};

export type SubscriptionListParams = {
  page?: number;
  pageSize?: number;
  status?: SubscriptionStatus;
};
