import type { Result } from "@lib/result";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { ServerContracts } from "@mebike/shared";
import { StatusCodes } from "http-status-codes";

import type {
  CreateSubscriptionPayload,
  SubscriptionListParams,
  SubscriptionListResponse,
  Subscription,
} from "@/types/subscription-types";

import type { SubscriptionError } from "./subscription-error";

import { asNetworkError, parseSubscriptionError } from "./subscription-error";

type V1Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function mapPagination(pagination: V1Pagination): SubscriptionListResponse["pagination"] {
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: pagination.total,
    totalPages: pagination.totalPages,
  };
}

function mapSubscription(row: ServerContracts.SubscriptionsContracts.SubscriptionDetail): Subscription {
  return {
    id: row.id,
    userId: row.userId,
    packageName: row.packageName,
    maxUsages: row.maxUsages,
    usageCount: row.usageCount,
    status: row.status,
    activatedAt: row.activatedAt,
    expiresAt: row.expiresAt,
    price: row.price,
    updatedAt: row.updatedAt,
  };
}

export const subscriptionService = {
  subscribe: async (
    payload: CreateSubscriptionPayload,
  ): Promise<Result<Subscription, SubscriptionError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.subscriptions.createSubscription), {
        json: { packageName: payload.packageName },
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.CREATED) {
        const data = await readJson(response);
        const parsed = decodeWithSchema(ServerContracts.SubscriptionsContracts.CreateSubscriptionResponseSchema, data);
        return parsed.ok ? ok(mapSubscription(parsed.value.data)) : err({ _tag: "DecodeError" });
      }

      return err(await parseSubscriptionError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  activate: async (subscriptionId: string): Promise<Result<Subscription, SubscriptionError>> => {
    try {
      const path = routePath(ServerRoutes.subscriptions.activateSubscription)
        .replace("{subscriptionId}", subscriptionId)
        .replace(":subscriptionId", subscriptionId);

      const response = await kyClient.post(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const data = await readJson(response);
        const parsed = decodeWithSchema(ServerContracts.SubscriptionsContracts.ActivateSubscriptionResponseSchema, data);
        return parsed.ok ? ok(mapSubscription(parsed.value.data)) : err({ _tag: "DecodeError" });
      }

      return err(await parseSubscriptionError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getList: async (
    params: SubscriptionListParams = {},
  ): Promise<Result<SubscriptionListResponse, SubscriptionError>> => {
    try {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 10;
      const status = params.status;

      const response = await kyClient.get(routePath(ServerRoutes.subscriptions.listSubscriptions), {
        searchParams: {
          page: String(page),
          pageSize: String(pageSize),
          ...(status ? { status } : {}),
        },
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const data = await readJson(response);
        const parsed = decodeWithSchema(ServerContracts.SubscriptionsContracts.ListSubscriptionsResponseSchema, data);
        if (!parsed.ok) {
          return err({ _tag: "DecodeError" });
        }

        return ok({
          data: parsed.value.data.map(mapSubscription),
          pagination: mapPagination(parsed.value.pagination),
        });
      }

      return err(await parseSubscriptionError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getDetail: async (subscriptionId: string): Promise<Result<Subscription, SubscriptionError>> => {
    try {
      const path = routePath(ServerRoutes.subscriptions.getSubscription)
        .replace("{subscriptionId}", subscriptionId)
        .replace(":subscriptionId", subscriptionId);
      const response = await kyClient.get(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const data = await readJson(response);
        const parsed = decodeWithSchema(ServerContracts.SubscriptionsContracts.SubscriptionDetailResponseSchema, data);
        return parsed.ok ? ok(mapSubscription(parsed.value.data)) : err({ _tag: "DecodeError" });
      }

      return err(await parseSubscriptionError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};
