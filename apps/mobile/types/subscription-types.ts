import type { Pagination } from "./Pagination";

export type SubscriptionStatus
  = | "ĐANG CHỜ XỬ LÍ"
    | "ĐANG HOẠT ĐỘNG"
    | "ĐÃ HẾT HẠN"
    | "ĐÃ HUỶ";

export type SubscriptionPackage = "basic" | "premium" | "unlimited";

export type DecimalValue = number | string;

export type PackageUsageType = "Finite" | "Infinite";
export type PackageStatus = "Active" | "Inactive";

export type PackageListItem = {
  id: string;
  name: string;
  price: string;
  maxUsages?: number | null;
  usageType: PackageUsageType;
  status: PackageStatus;
  createdAt: string;
  updatedAt: string;
};

export type PackageListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type PackageListPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type SubscriptionRecord = {
  _id: string;
  user_id?: string;
  package_name: string;
  packageId?: string;
  activated_at?: string | null;
  expires_at?: string | null;
  max_usages?: number | null;
  usage_count: number;
  price: number;
  status: SubscriptionStatus;
  created_at?: string;
  updated_at?: string;
  user?: {
    _id?: string;
    fullname?: string;
    email?: string;
  };
};

export type SubscriptionListItem = SubscriptionRecord;

export type SubscriptionDetail = {
  subscription: (Omit<SubscriptionRecord, "price"> & { price: number }) | null;
  user: {
    fullname?: string;
    email?: string;
  };
};

export type SubscriptionListResponse = {
  data: SubscriptionListItem[];
  pagination: Pagination;
};

export type PackageListResponse = {
  data: PackageListItem[];
  pagination?: PackageListPagination;
};

export type PackageListQueryResult = {
  data: {
    Packages: {
      success: boolean;
      message: string;
      data: PackageListItem[];
      errors?: (string | { message: string })[] | null;
      statusCode: number;
      pagination?: PackageListPagination;
    };
  } | null;
};

export type CreateSubscriptionPayload = {
  packageId: string;
  isActivated?: boolean;
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
