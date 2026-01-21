export type GraphQlEnvelope<T> = {
  data: T;
  errors?: Array<{ message?: string }>;
};

export type SubscriptionDataNode = {
  id: string;
  status: string;
  activatedAt?: string | null;
  expiredAt?: string | null;
  usageCounts?: number | null;
  package?: {
    id: string;
    name: string;
    price?: number | string;
    maxUsages?: number | null;
    usageType: string;
    status: string;
  } | null;
};

export type SubscriptionsQueryPayload = {
  Subscriptions: {
    success: boolean;
    message: string;
    data: SubscriptionDataNode[];
    errors?: (string | { message: string })[] | null;
    statusCode?: number;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
};

export type SubscriptionDetailQueryPayload = {
  Subscription: {
    success: boolean;
    message: string;
    data: SubscriptionDataNode | null;
    errors?: (string | { message: string })[] | null;
    statusCode?: number;
  };
};

export type CreateSubscriptionMutationPayload = {
  CreateSubscription: {
    success: boolean;
    message: string;
    data: SubscriptionDataNode | null;
    errors?: (string | { message: string })[] | null;
    statusCode?: number;
  };
};

export type ActivateSubscriptionMutationPayload = {
  ActivateSubscription: {
    success: boolean;
    message: string;
    data: SubscriptionDataNode | null;
    errors?: (string | { message: string })[] | null;
    statusCode?: number;
  };
};
