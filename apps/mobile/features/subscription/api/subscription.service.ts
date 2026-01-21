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

import type {
  ActivateSubscriptionMutationPayload,
  CreateSubscriptionMutationPayload,
  GraphQlEnvelope,
  SubscriptionDetailQueryPayload,
  SubscriptionsQueryPayload,
} from "./subscription.types";

import { mapSubscriptionDataToRecord } from "../mappers/subscription.mapper";
import {
  ACTIVATE_SUBSCRIPTION_MUTATION,
  CREATE_SUBSCRIPTION_MUTATION,
} from "./subscription.mutations";
import {
  PACKAGES_QUERY,
  SUBSCRIPTION_DETAIL_QUERY,
  SUBSCRIPTIONS_QUERY,
} from "./subscription.queries";

function unwrapGraphQlErrors(envelope: any) {
  const errors = envelope?.errors;
  if (Array.isArray(errors) && errors.length) {
    const messages = errors.map((e: any) => e?.message ?? String(e)).join(" | ");
    throw new Error(`GraphQL errors: ${messages}`);
  }
}

export const subscriptionFeatureService = {
  getPackages: async (
    params: PackageListParams = {},
  ) => {
    const response = await fetchHttpClient.query<PackageListQueryResult>(
      PACKAGES_QUERY,
      { params: params ?? {} },
    );
    const payload: PackageListQueryResult = response.data;
    return payload.data?.Packages?.data ?? [];
  },

  getList: async (
    params: SubscriptionListParams = {},
  ): Promise<SubscriptionListResponse> => {
    const response = await fetchHttpClient.query<GraphQlEnvelope<SubscriptionsQueryPayload>>(
      SUBSCRIPTIONS_QUERY,
      { params },
    );
    unwrapGraphQlErrors(response.data);

    const payload = response.data.data?.Subscriptions;
    const mapped = payload?.data?.map(mapSubscriptionDataToRecord) ?? [];

    const pagination = payload?.pagination;

    return {
      data: mapped,
      pagination: {
        limit: pagination?.limit ?? mapped.length,
        currentPage: pagination?.page ?? 1,
        totalPages: pagination?.totalPages ?? 1,
        totalRecords: pagination?.total ?? mapped.length,
      },
    };
  },

  getDetail: async (id: string): Promise<SubscriptionDetail> => {
    const response = await fetchHttpClient.query<GraphQlEnvelope<SubscriptionDetailQueryPayload>>(
      SUBSCRIPTION_DETAIL_QUERY,
      { id },
    );
    unwrapGraphQlErrors(response.data);

    const payload = response.data.data?.Subscription;
    const node = payload?.data;
    if (!node) {
      throw new Error(payload?.message || "Không tìm thấy gói");
    }

    const mapped = mapSubscriptionDataToRecord(node);

    return {
      subscription: mapped,
      user: {
        fullname: "",
        email: "",
      },
    };
  },

  subscribe: async (payload: CreateSubscriptionPayload): Promise<SubscriptionRecord> => {
    const response = await fetchHttpClient.mutation<GraphQlEnvelope<CreateSubscriptionMutationPayload>>(
      CREATE_SUBSCRIPTION_MUTATION,
      { body: payload },
    );
    unwrapGraphQlErrors(response.data);

    const result = response.data.data?.CreateSubscription;
    const node = result?.data;
    if (!node) {
      throw new Error(result?.message || "Không thể đăng ký gói");
    }

    return mapSubscriptionDataToRecord(node);
  },

  activate: async (id: string): Promise<SubscriptionRecord> => {
    const response = await fetchHttpClient.mutation<GraphQlEnvelope<ActivateSubscriptionMutationPayload>>(
      ACTIVATE_SUBSCRIPTION_MUTATION,
      { id },
    );
    unwrapGraphQlErrors(response.data);

    const result = response.data.data?.ActivateSubscription;
    const node = result?.data;
    if (!node) {
      throw new Error(result?.message || "Không thể kích hoạt gói");
    }

    return mapSubscriptionDataToRecord(node);
  },
};
