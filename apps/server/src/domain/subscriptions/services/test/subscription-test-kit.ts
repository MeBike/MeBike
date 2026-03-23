import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaNS } from "generated/prisma/client";

import { makeSubscriptionRepository, SubscriptionRepository } from "@/domain/subscriptions";
import { Prisma } from "@/infrastructure/prisma";
import { runEffectWithLayer } from "@/test/effect/run";

import { SubscriptionServiceLive, SubscriptionServiceTag } from "../subscription.service";

export type SubscriptionDeps = Prisma | SubscriptionRepository | SubscriptionServiceTag;

export function makeSubscriptionTestLayer(client: PrismaClient) {
  const subscriptionRepoLayer = Layer.succeed(
    SubscriptionRepository,
    makeSubscriptionRepository(client),
  );
  const subscriptionServiceLayer = SubscriptionServiceLive.pipe(
    Layer.provide(subscriptionRepoLayer),
  );

  return Layer.mergeAll(
    Layer.succeed(Prisma, Prisma.make({ client })),
    subscriptionRepoLayer,
    subscriptionServiceLayer,
  );
}

export function makeSubscriptionRunners(layer: Layer.Layer<SubscriptionDeps>) {
  return {
    runWithService<A, E>(eff: Effect.Effect<A, E, SubscriptionServiceTag>) {
      return runEffectWithLayer(eff, layer);
    },
    runInTxWithService<A, E>(
      client: PrismaClient,
      f: (tx: PrismaNS.TransactionClient) => Effect.Effect<A, E, SubscriptionServiceTag>,
    ) {
      return client.$transaction(async tx =>
        Effect.runPromise(f(tx).pipe(Effect.provide(layer))),
      );
    },
  };
}
