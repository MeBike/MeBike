import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import { env } from "@/config/env";

import type {
  ActiveSubscriptionExists,
  SubscriptionRepositoryError,
} from "../domain-errors";
import type { SubscriptionFilter, SubscriptionRow, SubscriptionSortField } from "../models";
import type { SubscriptionRepo } from "../repository/subscription.repository";

import {
  SubscriptionNotFound,
  SubscriptionNotPending,
  SubscriptionNotUsable,
  SubscriptionUsageExceeded,
} from "../domain-errors";
import { makeSubscriptionRepository, SubscriptionRepository } from "../repository/subscription.repository";

export type SubscriptionService = {
  createPending: (
    input: Parameters<SubscriptionRepo["createPending"]>[0],
  ) => Effect.Effect<SubscriptionRow, SubscriptionRepositoryError>;

  findById: (
    subscriptionId: string,
  ) => Effect.Effect<Option.Option<SubscriptionRow>, SubscriptionRepositoryError>;

  findCurrentForUser: (
    userId: string,
    statuses: Parameters<SubscriptionRepo["findCurrentForUser"]>[1],
  ) => Effect.Effect<Option.Option<SubscriptionRow>, SubscriptionRepositoryError>;

  listForUser: (
    userId: string,
    filter: SubscriptionFilter,
    pageReq: PageRequest<SubscriptionSortField>,
  ) => Effect.Effect<PageResult<SubscriptionRow>, SubscriptionRepositoryError>;

  activate: (
    input: Parameters<SubscriptionRepo["activate"]>[0],
  ) => Effect.Effect<
    SubscriptionRow,
    SubscriptionRepositoryError | ActiveSubscriptionExists | SubscriptionNotFound | SubscriptionNotPending
  >;

  incrementUsage: (
    subscriptionId: string,
    expectedUsageCount: number,
    amount: number,
  ) => Effect.Effect<
    SubscriptionRow,
    SubscriptionRepositoryError | SubscriptionNotFound | SubscriptionNotUsable
  >;

  useOneInTx: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
    input: {
      readonly subscriptionId: string;
      readonly userId: string;
      readonly now?: Date;
    },
  ) => Effect.Effect<
    SubscriptionRow,
    | SubscriptionRepositoryError
    | SubscriptionNotFound
    | SubscriptionNotUsable
    | SubscriptionUsageExceeded
  >;

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

      findById: subscriptionId =>
        repo.findById(subscriptionId),

      findCurrentForUser: (userId, statuses) =>
        repo.findCurrentForUser(userId, statuses),

      listForUser: (userId, filter, pageReq) =>
        repo.listForUser(userId, filter, pageReq),

      activate: input =>
        Effect.gen(function* () {
          const activatedOpt = yield* repo.activate(input);
          if (Option.isSome(activatedOpt)) {
            return activatedOpt.value;
          }

          const existing = yield* repo.findById(input.subscriptionId);
          if (Option.isNone(existing)) {
            return yield* Effect.fail(new SubscriptionNotFound({
              subscriptionId: input.subscriptionId,
            }));
          }

          return yield* Effect.fail(new SubscriptionNotPending({
            subscriptionId: input.subscriptionId,
          }));
        }),

      incrementUsage: (subscriptionId, expectedUsageCount, amount) =>
        Effect.gen(function* () {
          const updatedOpt = yield* repo.incrementUsage(subscriptionId, expectedUsageCount, amount);
          if (Option.isSome(updatedOpt)) {
            return updatedOpt.value;
          }

          const existing = yield* repo.findById(subscriptionId);
          if (Option.isNone(existing)) {
            return yield* Effect.fail(new SubscriptionNotFound({
              subscriptionId,
            }));
          }

          return yield* Effect.fail(new SubscriptionNotUsable({
            subscriptionId,
            status: existing.value.status,
          }));
        }),

      useOneInTx: (tx, input) =>
        Effect.gen(function* () {
          const txRepo = makeSubscriptionRepository(tx);

          const subscriptionOpt = yield* txRepo.findById(input.subscriptionId);
          if (Option.isNone(subscriptionOpt)) {
            return yield* Effect.fail(new SubscriptionNotFound({
              subscriptionId: input.subscriptionId,
            }));
          }
          const subscription = subscriptionOpt.value;
          const now = input.now ?? new Date();

          if (subscription.userId !== input.userId) {
            return yield* Effect.fail(new SubscriptionNotUsable({
              subscriptionId: input.subscriptionId,
              status: subscription.status,
            }));
          }

          if (subscription.status !== "ACTIVE" && subscription.status !== "PENDING") {
            return yield* Effect.fail(new SubscriptionNotUsable({
              subscriptionId: input.subscriptionId,
              status: subscription.status,
            }));
          }

          if (
            subscription.maxUsages !== null
            && subscription.usageCount >= subscription.maxUsages
          ) {
            return yield* Effect.fail(new SubscriptionUsageExceeded({
              subscriptionId: input.subscriptionId,
              usageCount: subscription.usageCount,
              maxUsages: subscription.maxUsages,
            }));
          }

          let current = subscription;
          if (subscription.status === "PENDING") {
            const expiresAt = new Date(
              now.getTime() + env.EXPIRE_AFTER_DAYS * 24 * 60 * 60 * 1000,
            );
            const activated = yield* txRepo.activate({
              subscriptionId: subscription.id,
              activatedAt: now,
              expiresAt,
            }).pipe(
              Effect.catchTag(
                "ActiveSubscriptionExists",
                () =>
                  Effect.fail(new SubscriptionNotUsable({
                    subscriptionId: subscription.id,
                    status: "ACTIVE",
                  })),
              ),
            );

            if (Option.isNone(activated)) {
              return yield* Effect.fail(new SubscriptionNotUsable({
                subscriptionId: subscription.id,
                status: subscription.status,
              }));
            }

            current = activated.value;
          }

          const updated = yield* txRepo.incrementUsage(
            current.id,
            current.usageCount,
            1,
            ["ACTIVE", "PENDING"],
          );

          if (Option.isNone(updated)) {
            return yield* Effect.fail(new SubscriptionUsageExceeded({
              subscriptionId: input.subscriptionId,
              usageCount: subscription.usageCount,
              maxUsages: subscription.maxUsages ?? subscription.usageCount,
            }));
          }

          return updated.value;
        }),

      markExpiredNow: now =>
        repo.markExpiredNow(now),
    };

    return service;
  }),
);
