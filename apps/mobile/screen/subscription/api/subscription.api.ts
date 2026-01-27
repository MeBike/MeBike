import fetchHttpClient from "@lib/httpClient";
import { log } from "@lib/logger";
import { print } from "graphql";

import type {
  CreateSubscriptionPayload,
  PackageListItem,
  PackageListParams,
  SubscriptionDetail,
  SubscriptionListParams,
  SubscriptionListResponse,
  SubscriptionRecord,
} from "@/types/subscription-types";

import {
  ACTIVATE_SUBSCRIPTION,
  CREATE_SUBSCRIPTION,
  GET_PACKAGES,
  GET_SUBSCRIPTION_DETAIL,
  GET_SUBSCRIPTIONS,
} from "@/graphql";
import {
  ActivateSubscriptionResponseSchema,
  CreateSubscriptionResponseSchema,
  PackagesResponseSchema,
  SubscriptionDetailResponseSchema,
  SubscriptionsResponseSchema,
} from "@/lib/schemas/subscription.schema";
import { parseOrWarn } from "@/lib/validation/parse-or-warn";

import { mapSubscriptionDataToRecord } from "../mappers/subscription.mapper";

function unwrapGraphQlErrors(envelope: any) {
  const errors = envelope?.errors;
  if (Array.isArray(errors) && errors.length) {
    const messages = errors
      .map((e: any) => e?.message ?? String(e))
      .join(" | ");
    throw new Error(`GraphQL errors: ${messages}`);
  }
}

function assertEnvelopeSuccess(
  envelope: { success?: boolean; message?: string } | undefined,
  fallback: string,
) {
  if (!envelope)
    throw new Error(fallback);
  if (envelope.success === false)
    throw new Error(envelope.message || fallback);
}

export const subscriptionService = {
  getPackages: async (params: PackageListParams = {}) => {
    const response = await fetchHttpClient.query(print(GET_PACKAGES), {
      params: params ?? {},
    });

    const parsed = parseOrWarn(
      PackagesResponseSchema,
      response.data,
      { op: "Packages" },
      { data: { Packages: { data: [], pagination: undefined } } },
    );

    const payload = parsed.data.data?.Packages;
    if (payload?.success === false) {
      return [];
    }

    const items: PackageListItem[] = (payload?.data ?? []).map((pkg: any) => {
      const price = pkg?.price;
      const priceString
        = typeof price === "number" ? String(price) : String(price ?? 0);
      return {
        id: String(pkg?.id ?? ""),
        name: String(pkg?.name ?? ""),
        price: priceString,
        maxUsages: pkg?.maxUsages ?? null,
        usageType: (pkg?.usageType ?? "Finite") as any,
        status: (pkg?.status ?? "Inactive") as any,
        createdAt: String(pkg?.createdAt ?? ""),
        updatedAt: String(pkg?.updatedAt ?? ""),
      };
    });

    return items;
  },

  getList: async (
    params: SubscriptionListParams = {},
  ): Promise<SubscriptionListResponse> => {
    const response = await fetchHttpClient.query(print(GET_SUBSCRIPTIONS), {
      params,
    });

    const parsed = parseOrWarn(
      SubscriptionsResponseSchema,
      response.data,
      { op: "Subscriptions" },
      { data: { Subscriptions: { data: [], pagination: undefined } } },
    );

    const payload = parsed.data.data?.Subscriptions;
    if (payload?.success === false) {
      return {
        data: [],
        pagination: {
          limit: 0,
          currentPage: 1,
          totalPages: 1,
          totalRecords: 0,
        },
      };
    }

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
    const response = await fetchHttpClient.query(
      print(GET_SUBSCRIPTION_DETAIL),
      { id },
    );

    const parsed = parseOrWarn(
      SubscriptionDetailResponseSchema,
      response.data,
      { op: "Subscription" },
      { data: { Subscription: { data: null } } },
    );

    const payload = parsed.data.data?.Subscription;
    if (payload?.success === false) {
      return {
        subscription: null,
        user: {
          fullname: "",
          email: "",
        },
      };
    }

    const node = payload?.data;
    const mapped = node ? mapSubscriptionDataToRecord(node) : null;

    return {
      subscription: mapped,
      user: {
        fullname: "",
        email: "",
      },
    };
  },

  subscribe: async (
    payload: CreateSubscriptionPayload,
  ): Promise<SubscriptionRecord> => {
    log.info("[Subscription] CreateSubscription", {
      packageId: payload.packageId,
      isActivated: payload.isActivated ?? undefined,
    });

    try {
      const response = await fetchHttpClient.mutation(
        print(CREATE_SUBSCRIPTION),
        { body: payload },
      );

      unwrapGraphQlErrors(response.data);

      const parsed = parseOrWarn(
        CreateSubscriptionResponseSchema,
        response.data,
        { op: "CreateSubscription" },
        { data: { CreateSubscription: { data: null } } },
      );

      const result = parsed.data.data?.CreateSubscription;
      assertEnvelopeSuccess(result, "Không thể đăng ký gói");

      const node = result?.data;
      if (!node) {
        throw new Error(result?.message || "Không thể đăng ký gói");
      }

      log.info("[Subscription] CreateSubscription ok", {
        subscriptionId: node.id,
        status: node.status ?? undefined,
      });

      return mapSubscriptionDataToRecord(node);
    }
    catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      log.warn("[Subscription] CreateSubscription failed", {
        status,
        response: data,
        message: error?.message,
      });
      throw error;
    }
  },

  activate: async (id: string): Promise<SubscriptionRecord> => {
    const response = await fetchHttpClient.mutation(
      print(ACTIVATE_SUBSCRIPTION),
      { id },
    );

    unwrapGraphQlErrors(response.data);

    const parsed = parseOrWarn(
      ActivateSubscriptionResponseSchema,
      response.data,
      { op: "ActivateSubscription" },
      { data: { ActivateSubscription: { data: null } } },
    );

    const result = parsed.data.data?.ActivateSubscription;
    assertEnvelopeSuccess(result, "Không thể kích hoạt gói");

    const node = result?.data;
    if (!node) {
      throw new Error(result?.message || "Không thể kích hoạt gói");
    }

    return mapSubscriptionDataToRecord(node);
  },
};
