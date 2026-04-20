import { Effect, Option } from "effect";

import type { SubscriptionCommandRepo, SubscriptionQueryRepo } from "../../repository/subscription.repository.types";
import type { SubscriptionCommandService } from "../subscription.service.types";

import {
  SubscriptionNotFound,
  SubscriptionNotPending,
  SubscriptionNotUsable,
  SubscriptionUsageExceeded,
} from "../../domain-errors";
import { makeSubscriptionCommandRepository } from "../../repository/subscription-command.repository";
import { makeSubscriptionQueryRepository } from "../../repository/subscription-query.repository";
import { computeExpiresAt } from "../shared/subscription-flow.shared";

/**
 * Tao command service cho subscriptions.
 *
 * Service nay gom phan ghi du lieu va phan map loi domain,
 * de caller khong phai tu giai thich `Option.none()` o tang repo nghia la gi.
 *
 * @param args Tap repository can cho command service.
 * @param args.commandRepo Command repository phuc vu cac thao tac ghi.
 * @param args.queryRepo Query repository giup phan biet not found va state conflict.
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
     * Dung dung mot luot subscription ben trong transaction hien co.
     *
     * Ten ham giu o muc nghiep vu (`useOne`) thay vi phoi chi tiet trien khai.
     * Caller chi can biet truyen `tx` de cung transaction voi reservation/rental hien tai.
     *
     * @param tx Prisma transaction client dang duoc caller su dung.
     * @param input Thong tin su dung subscription trong transaction hien tai.
     * @param input.subscriptionId Subscription can dung.
     * @param input.userId User dang so huu subscription.
     * @param input.now Moc thoi gian xu ly. Mac dinh dung thoi gian hien tai.
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
          const expiresAt = computeExpiresAt(now);
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
