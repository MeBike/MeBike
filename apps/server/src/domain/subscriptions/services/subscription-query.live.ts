import { Effect, Layer } from "effect";

import { SubscriptionQueryRepository } from "../repository/subscription-query.repository";
import { makeSubscriptionQueryService } from "./subscription-query.service";

export type { SubscriptionQueryService } from "./subscription.service.types";

const makeSubscriptionQueryServiceEffect = Effect.gen(function* () {
  const repo = yield* SubscriptionQueryRepository;
  return makeSubscriptionQueryService(repo);
});

export class SubscriptionQueryServiceTag extends Effect.Service<SubscriptionQueryServiceTag>()(
  "SubscriptionQueryService",
  {
    effect: makeSubscriptionQueryServiceEffect,
  },
) {}

export const SubscriptionQueryServiceLive = Layer.effect(
  SubscriptionQueryServiceTag,
  makeSubscriptionQueryServiceEffect.pipe(Effect.map(SubscriptionQueryServiceTag.make)),
);
