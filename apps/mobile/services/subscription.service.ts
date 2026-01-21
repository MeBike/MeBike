import type { AxiosResponse } from "axios";

import fetchHttpClient from "@lib/httpClient";

import type {
  CreateSubscriptionPayload,
  PackageListParams,
  PackageListQueryResult,
  SubscriptionDetail,
  SubscriptionListParams,
  SubscriptionListResponse,
  SubscriptionRecord,
} from "@/types/subscription-types";

const SUBSCRIPTION_BASE = "/subscriptions";

const SUBSCRIPTION_ENDPOINTS = {
  BASE: SUBSCRIPTION_BASE,
  SUBSCRIBE: `${SUBSCRIPTION_BASE}/subscribe`,
  DETAIL: (id: string) => `${SUBSCRIPTION_BASE}/${id}`,
  ACTIVATE: (id: string) => `${SUBSCRIPTION_BASE}/${id}/activate`,
} as const;

type MessageResponse<T = undefined> = {
  message: string;
  result?: T;
};

const PACKAGES_QUERY = `
  query Packages($params: GetPackageListInput) {
    Packages(params: $params) {
      success
      message
      data {
        id
        name
        price
        maxUsages
        usageType
        status
        createdAt
        updatedAt
      }
      errors
      statusCode
      pagination {
        total
        page
        limit
        totalPages
      }
    }
  }
`;

export const subscriptionService = {
  subscribe: async (
    payload: CreateSubscriptionPayload,
  ): Promise<AxiosResponse<MessageResponse<SubscriptionRecord>>> => {
    return fetchHttpClient.post<MessageResponse<SubscriptionRecord>>(
      SUBSCRIPTION_ENDPOINTS.SUBSCRIBE,
      payload,
    );
  },

  activate: async (id: string): Promise<AxiosResponse<MessageResponse>> => {
    return fetchHttpClient.post<MessageResponse>(
      SUBSCRIPTION_ENDPOINTS.ACTIVATE(id),
    );
  },

  getList: async (
    params: SubscriptionListParams = {},
  ): Promise<AxiosResponse<SubscriptionListResponse>> => {
    return fetchHttpClient.get<SubscriptionListResponse>(
      SUBSCRIPTION_ENDPOINTS.BASE,
      params,
    );
  },

  getDetail: async (
    id: string,
  ): Promise<AxiosResponse<MessageResponse<SubscriptionDetail>>> => {
    return fetchHttpClient.get<MessageResponse<SubscriptionDetail>>(
      SUBSCRIPTION_ENDPOINTS.DETAIL(id),
    );
  },

  getPackages: async (
    params: PackageListParams = {},
  ): Promise<AxiosResponse<PackageListQueryResult>> => {
    return fetchHttpClient.query(PACKAGES_QUERY, { params: params ?? {} });
  },
};
