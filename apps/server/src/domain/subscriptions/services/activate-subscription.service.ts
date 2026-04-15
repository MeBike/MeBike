import { Effect, Option } from "effect";

import type { SubscriptionRow } from "../models";
import type { ActivateSubscriptionFailure } from "./subscription-flows.shared";

import {
  SubscriptionNotFound as SubscriptionNotFoundError,
  SubscriptionNotPending as SubscriptionNotPendingError,
} from "../domain-errors";
import {
  SubscriptionCommandServiceTag,
} from "../services/subscription-command.live";
import {
  SubscriptionQueryServiceTag,
} from "../services/subscription-query.live";
import { computeExpiresAt } from "./subscription-flows.shared";

/**
 * Kích hoạt ngay một subscription đang ở trạng thái pending.
 *
 * Use case này giữ phần check đọc riêng ra trước khi gọi command service,
 * để lỗi trả về vẫn rõ ràng khi đọc log hoặc debug job auto-activate.
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
