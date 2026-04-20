import { Effect, Option } from "effect";

import type { SubscriptionRow } from "../../models";
import type { UseSubscriptionFailure } from "../shared/subscription-flow.shared";

import {
  SubscriptionExpired as SubscriptionExpiredError,
  SubscriptionNotFound as SubscriptionNotFoundError,
  SubscriptionNotUsable as SubscriptionNotUsableError,
  SubscriptionUsageExceeded as SubscriptionUsageExceededError,
} from "../../domain-errors";
import {
  SubscriptionCommandServiceTag,
} from "./subscription-command.live";
import {
  SubscriptionQueryServiceTag,
} from "../queries/subscription-query.live";
import { computeExpiresAt } from "../shared/subscription-flow.shared";

/**
 * Dung dung mot luot subscription o lop use case thong thuong.
 *
 * Flow nay lam cac buoc check re truoc, sau do giao phan doi trang thai/ghi du lieu
 * cho command service de caller khac co the tai su dung ma khong phai copy lai guard logic.
 *
 * @param args.subscriptionId Subscription can dung.
 * @param args.userId User dang thuc hien luot su dung.
 * @param args.now Moc thoi gian xu ly. Mac dinh dung thoi gian hien tai.
 */
export function useSubscriptionOnceUseCase(args: {
  subscriptionId: string;
  userId: string;
  now?: Date;
}): Effect.Effect<
  SubscriptionRow,
  UseSubscriptionFailure,
  SubscriptionQueryServiceTag | SubscriptionCommandServiceTag
> {
  return Effect.gen(function* () {
    const queryService = yield* SubscriptionQueryServiceTag;
    const commandService = yield* SubscriptionCommandServiceTag;
    const now = args.now ?? new Date();
    // TODO: add a small bounded retry when incrementUsage CAS fails due to concurrent usage.

    const subOpt = yield* queryService.getById(args.subscriptionId);
    if (Option.isNone(subOpt)) {
      return yield* Effect.fail(
        new SubscriptionNotFoundError({ subscriptionId: args.subscriptionId }),
      );
    }

    const sub = subOpt.value;

    if (sub.userId !== args.userId) {
      return yield* Effect.fail(
        new SubscriptionNotUsableError({
          subscriptionId: sub.id,
          status: sub.status,
        }),
      );
    }

    if (sub.status === "CANCELLED" || sub.status === "EXPIRED") {
      return yield* Effect.fail(
        new SubscriptionNotUsableError({
          subscriptionId: sub.id,
          status: sub.status,
        }),
      );
    }

    if (sub.expiresAt && sub.expiresAt <= now) {
      return yield* Effect.fail(
        new SubscriptionExpiredError({ subscriptionId: sub.id }),
      );
    }

    if (sub.maxUsages !== null && sub.usageCount >= sub.maxUsages) {
      return yield* Effect.fail(
        new SubscriptionUsageExceededError({
          subscriptionId: sub.id,
          usageCount: sub.usageCount,
          maxUsages: sub.maxUsages,
        }),
      );
    }

    const maybeActivated = sub.status === "PENDING"
      ? yield* commandService.activate({
        subscriptionId: sub.id,
        activatedAt: now,
        expiresAt: computeExpiresAt(now),
      }).pipe(
        Effect.catchTag(
          "SubscriptionNotPending",
          err =>
            Effect.fail(new SubscriptionNotUsableError({
              subscriptionId: err.subscriptionId,
              status: "PENDING",
            })),
        ),
      )
      : sub;

    const incremented = yield* commandService.incrementUsage(
      maybeActivated.id,
      maybeActivated.usageCount,
      1,
    );

    return incremented;
  });
}
