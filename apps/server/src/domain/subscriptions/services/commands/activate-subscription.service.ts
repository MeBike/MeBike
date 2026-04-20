import { Effect, Option } from "effect";

import type { SubscriptionRow } from "../../models";
import type { ActivateSubscriptionFailure } from "../shared/subscription-flow.shared";

import {
  SubscriptionNotFound as SubscriptionNotFoundError,
  SubscriptionNotPending as SubscriptionNotPendingError,
} from "../../domain-errors";
import {
  SubscriptionQueryServiceTag,
} from "../queries/subscription-query.live";
import { computeExpiresAt } from "../shared/subscription-flow.shared";
import {
  SubscriptionCommandServiceTag,
} from "./subscription-command.live";

/**
 * Kich hoat ngay mot subscription dang o trang thai pending.
 *
 * Use case nay giu phan check doc rieng ra truoc khi goi command service,
 * de loi tra ve van ro rang khi doc log hoac debug job auto-activate.
 *
 * @param args Thong tin kich hoat subscription.
 * @param args.subscriptionId Id subscription can kich hoat.
 * @param args.now Moc thoi gian kich hoat. Mac dinh dung thoi gian hien tai.
 */
export function activateSubscriptionUseCase(args: {
  subscriptionId: string;
  now?: Date;
}): Effect.Effect<
  SubscriptionRow,
  ActivateSubscriptionFailure,
  SubscriptionQueryServiceTag | SubscriptionCommandServiceTag
> {
  return Effect.gen(function* () {
    const queryService = yield* SubscriptionQueryServiceTag;
    const commandService = yield* SubscriptionCommandServiceTag;
    const now = args.now ?? new Date();

    const subOpt = yield* queryService.getById(args.subscriptionId);
    if (Option.isNone(subOpt)) {
      return yield* Effect.fail(
        new SubscriptionNotFoundError({ subscriptionId: args.subscriptionId }),
      );
    }

    const sub = subOpt.value;

    if (sub.status !== "PENDING") {
      return yield* Effect.fail(
        new SubscriptionNotPendingError({ subscriptionId: sub.id }),
      );
    }

    const activated = yield* commandService.activate({
      subscriptionId: sub.id,
      activatedAt: now,
      expiresAt: computeExpiresAt(now),
    });

    return activated;
  });
}
