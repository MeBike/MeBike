import { Effect, Layer } from "effect";

import { SubscriptionCommandRepository } from "../../repository/subscription-command.repository";
import { SubscriptionQueryRepository } from "../../repository/subscription-query.repository";
import { makeSubscriptionCommandService } from "./subscription-command.service";

export type { SubscriptionCommandService } from "../subscription.service.types";

const makeSubscriptionCommandServiceEffect = Effect.gen(function* () {
  const commandRepo = yield* SubscriptionCommandRepository;
  const queryRepo = yield* SubscriptionQueryRepository;

  return makeSubscriptionCommandService({
    commandRepo,
    queryRepo,
  });
});

export class SubscriptionCommandServiceTag extends Effect.Service<SubscriptionCommandServiceTag>()(
  "SubscriptionCommandService",
  {
    effect: makeSubscriptionCommandServiceEffect,
  },
) {}

export const SubscriptionCommandServiceLive = Layer.effect(
  SubscriptionCommandServiceTag,
  makeSubscriptionCommandServiceEffect.pipe(Effect.map(SubscriptionCommandServiceTag.make)),
);
