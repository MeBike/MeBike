import { Effect, Option } from "effect";

import { env } from "@/config/env";

import type { SubscriptionCommandRepo, SubscriptionQueryRepo } from "../repository/subscription.repository.types";
import type { SubscriptionCommandService } from "./subscription.service.types";

import {
  SubscriptionNotFound,
  SubscriptionNotPending,
  SubscriptionNotUsable,
  SubscriptionUsageExceeded,
} from "../domain-errors";
import { makeSubscriptionCommandRepository } from "../repository/subscription-command.repository";
import { makeSubscriptionQueryRepository } from "../repository/subscription-query.repository";

/**
 * Tạo command service cho subscriptions.
 *
 * Service này gom phần ghi dữ liệu và phần map lỗi domain,
 * để caller không phải tự giải thích `Option.none()` ở tầng repo nghĩa là gì.
 */
export function makeSubscriptionCommandService(args: {
  commandRepo: SubscriptionCommandRepo;
  queryRepo: SubscriptionQueryRepo;
}): SubscriptionCommandService {
  const { commandRepo, queryRepo } = args;

  return {
    createPending: input => commandRepo.createPending(input),

    activate: input =>
      Effect.gen(function* () {
        const activatedOpt = yield* commandRepo.activate(input);
        if (Option.isSome(activatedOpt)) {
          return activatedOpt.value;
        }

        const existing = yield* queryRepo.findById(input.subscriptionId);
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
        const updatedOpt = yield* commandRepo.incrementUsage(subscriptionId, expectedUsageCount, amount);
        if (Option.isSome(updatedOpt)) {
          return updatedOpt.value;
        }

        const existing = yield* queryRepo.findById(subscriptionId);
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

    /**
     * Dùng đúng một lượt subscription bên trong transaction hiện có.
     *
     * Tên hàm giữ ở mức nghiệp vụ (`useOne`) thay vì phơi chi tiết triển khai.
     * Caller chỉ cần biết truyền `tx` để cùng transaction với reservation/rental hiện tại.
     */
    useOne: (tx, input) =>
      Effect.gen(function* () {
        const txQueryRepo = makeSubscriptionQueryRepository(tx);
        const txCommandRepo = makeSubscriptionCommandRepository(tx);

        const subscriptionOpt = yield* txQueryRepo.findById(input.subscriptionId);
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
          const activated = yield* txCommandRepo.activate({
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

        const updated = yield* txCommandRepo.incrementUsage(
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

    markExpiredNow: now => commandRepo.markExpiredNow(now),
  };
}
