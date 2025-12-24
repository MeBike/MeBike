import type { Option } from "effect";

import { Context, Effect, Layer } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  ActiveSubscriptionExists,
  SubscriptionRepositoryError,
} from "../domain-errors";
import type { SubscriptionFilter, SubscriptionRow, SubscriptionSortField } from "../models";
import type { SubscriptionRepo } from "../repository/subscription.repository";

import { SubscriptionRepository } from "../repository/subscription.repository";

export type SubscriptionService = {
  createPending: (
    input: Parameters<SubscriptionRepo["createPending"]>[0],
  ) => Effect.Effect<SubscriptionRow, SubscriptionRepositoryError>;

  createPendingInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: Parameters<SubscriptionRepo["createPendingInTx"]>[1],
  ) => Effect.Effect<SubscriptionRow, SubscriptionRepositoryError>;

  findById: (
    subscriptionId: string,
  ) => Effect.Effect<Option.Option<SubscriptionRow>, SubscriptionRepositoryError>;

  findCurrentForUser: (
    userId: string,
    statuses: Parameters<SubscriptionRepo["findCurrentForUser"]>[1],
  ) => Effect.Effect<Option.Option<SubscriptionRow>, SubscriptionRepositoryError>;

  findCurrentForUserInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    userId: string,
    statuses: Parameters<SubscriptionRepo["findCurrentForUserInTx"]>[2],
  ) => Effect.Effect<Option.Option<SubscriptionRow>, SubscriptionRepositoryError>;

  listForUser: (
    userId: string,
    filter: SubscriptionFilter,
    pageReq: PageRequest<SubscriptionSortField>,
  ) => Effect.Effect<PageResult<SubscriptionRow>, SubscriptionRepositoryError>;

  activate: (
    input: Parameters<SubscriptionRepo["activate"]>[0],
  ) => Effect.Effect<
    Option.Option<SubscriptionRow>,
    SubscriptionRepositoryError | ActiveSubscriptionExists
  >;

  incrementUsage: (
    subscriptionId: string,
    expectedUsageCount: number,
    amount: number,
  ) => Effect.Effect<Option.Option<SubscriptionRow>, SubscriptionRepositoryError>;

  markExpiredNow: (
    now: Date,
  ) => Effect.Effect<number, SubscriptionRepositoryError>;
};

export class SubscriptionServiceTag extends Context.Tag("SubscriptionService")<
  SubscriptionServiceTag,
  SubscriptionService
>() {}

export const SubscriptionServiceLive = Layer.effect(
  SubscriptionServiceTag,
  Effect.gen(function* () {
    const repo = yield* SubscriptionRepository;

    const service: SubscriptionService = {
      createPending: input =>
        repo.createPending(input),

      createPendingInTx: (tx, input) =>
        repo.createPendingInTx(tx, input),

      findById: subscriptionId =>
        repo.findById(subscriptionId),

      findCurrentForUser: (userId, statuses) =>
        repo.findCurrentForUser(userId, statuses),

      findCurrentForUserInTx: (tx, userId, statuses) =>
        repo.findCurrentForUserInTx(tx, userId, statuses),

      listForUser: (userId, filter, pageReq) =>
        repo.listForUser(userId, filter, pageReq),

      activate: input =>
        repo.activate(input),

      incrementUsage: (subscriptionId, expectedUsageCount, amount) =>
        repo.incrementUsage(subscriptionId, expectedUsageCount, amount),

      markExpiredNow: now =>
        repo.markExpiredNow(now),
    };

    return service;
  }),
);
