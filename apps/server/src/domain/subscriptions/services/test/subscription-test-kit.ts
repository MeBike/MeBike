import { Effect, Layer } from "effect";

import type {
  SubscriptionCommandServiceTag,
  SubscriptionQueryServiceTag,
} from "@/domain/subscriptions";
import type { PrismaClient, Prisma as PrismaNS } from "generated/prisma/client";

import {
  makeSubscriptionCommandRepository,
  makeSubscriptionQueryRepository,
  SubscriptionCommandRepository,
  SubscriptionCommandServiceLive,
  SubscriptionQueryRepository,
  SubscriptionQueryServiceLive,
} from "@/domain/subscriptions";
import { Prisma } from "@/infrastructure/prisma";
import { runEffectWithLayer } from "@/test/effect/run";

export type SubscriptionDeps
  = | Prisma
    | SubscriptionQueryRepository
    | SubscriptionCommandRepository
    | SubscriptionQueryServiceTag
    | SubscriptionCommandServiceTag;

export function makeSubscriptionTestLayer(client: PrismaClient) {
  const subscriptionQueryRepoLayer = Layer.succeed(
    SubscriptionQueryRepository,
    SubscriptionQueryRepository.make(makeSubscriptionQueryRepository(client)),
  );
  const subscriptionCommandRepoLayer = Layer.succeed(
    SubscriptionCommandRepository,
    SubscriptionCommandRepository.make(makeSubscriptionCommandRepository(client)),
  );
  const subscriptionQueryServiceLayer = SubscriptionQueryServiceLive.pipe(
    Layer.provide(subscriptionQueryRepoLayer),
  );
  const subscriptionCommandServiceLayer = SubscriptionCommandServiceLive.pipe(
    Layer.provide(Layer.mergeAll(subscriptionQueryRepoLayer, subscriptionCommandRepoLayer)),
  );

  return Layer.mergeAll(
    Layer.succeed(Prisma, Prisma.make({ client })),
    subscriptionQueryRepoLayer,
    subscriptionCommandRepoLayer,
    subscriptionQueryServiceLayer,
    subscriptionCommandServiceLayer,
  );
}

export function makeSubscriptionRunners(layer: Layer.Layer<SubscriptionDeps>) {
  return {
    runWithService<A, E, R extends SubscriptionDeps>(eff: Effect.Effect<A, E, R>) {
      return runEffectWithLayer(eff, layer);
    },
    runInTxWithService<A, E, R extends SubscriptionDeps>(
      client: PrismaClient,
      f: (tx: PrismaNS.TransactionClient) => Effect.Effect<A, E, R>,
    ) {
      return client.$transaction(async tx =>
        Effect.runPromise(
          f(tx).pipe(Effect.provide(layer)) as Effect.Effect<A, E, never>,
        ),
      );
    },
  };
}
