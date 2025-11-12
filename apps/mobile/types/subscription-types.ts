import type { Pagination } from "./Pagination";

export type SubscriptionStatus =
  | "ĐANG CHỜ XỬ LÍ"
  | "ĐANG HOẠT ĐỘNG"
  | "ĐÃ HẾT HẠN"
  | "ĐÃ HUỶ";

export type SubscriptionPackage = "basic" | "premium" | "unlimited";

export type MongoDecimal = number | string | { $numberDecimal?: string };

export type SubscriptionRecord = {
  _id: string;
  user_id: string;
  package_name: SubscriptionPackage;
  activated_at?: string | null;
  expires_at?: string | null;
  max_usages?: number | null;
  usage_count: number;
  price: MongoDecimal;
  status: SubscriptionStatus;
  created_at?: string;
  updated_at?: string;
};

export type SubscriptionListItem = {
  _id: string;
  user: {
    _id: string;
    fullname: string;
  };
  package_name: SubscriptionPackage;
  activated_at?: string | null;
  expires_at?: string | null;
  max_usages?: number | null;
  usage_count: number;
  price: number;
  status: SubscriptionStatus;
  created_at?: string;
  updated_at?: string;
};

export type SubscriptionDetail = {
  subscription: Omit<SubscriptionRecord, "price"> & { price: number };
  user: {
    fullname: string;
    email: string;
  };
};

export type SubscriptionListResponse = {
  data: SubscriptionListItem[];
  pagination: Pagination;
};

export type CreateSubscriptionPayload = {
  package_name: SubscriptionPackage;
};

export type SubscriptionListParams = {
  page?: number;
  limit?: number;
  status?: SubscriptionStatus;
  user_id?: string;
  package_name?: SubscriptionPackage;
  start_date?: string;
  end_date?: string;
};
