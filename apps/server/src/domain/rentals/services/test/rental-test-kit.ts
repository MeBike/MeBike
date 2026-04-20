import { Layer } from "effect";

import type { ConfirmRentalReturnInput, StartRentalInput } from "@/domain/rentals/types";
import type {
  SubscriptionCommandServiceTag,
  SubscriptionQueryServiceTag,
} from "@/domain/subscriptions";
import type { PrismaClient } from "generated/prisma/client";

import { BikeRepository, makeBikeRepository } from "@/domain/bikes";
import {
  cancelReturnSlot,
  confirmRentalReturnByOperator,
  createReturnSlot,
  getCurrentReturnSlot,
  makeRentalRepository,
  makeReturnConfirmationRepository,
  makeReturnSlotRepository,
  RentalRepository,
  ReturnConfirmationRepository,
  ReturnSlotRepository,
  startRental,
} from "@/domain/rentals";
import {
  makeSubscriptionCommandRepository,
  makeSubscriptionQueryRepository,
  SubscriptionCommandRepository,
  SubscriptionCommandServiceLive,
  SubscriptionQueryRepository,
  SubscriptionQueryServiceLive,
} from "@/domain/subscriptions";
import { Prisma } from "@/infrastructure/prisma";
import { runEffectEitherWithLayer, runEffectWithLayer } from "@/test/effect/run";

const DEFAULT_TEST_NOW = new Date("2025-01-01T10:00:00.000Z");

export type RentalDeps
  = | Prisma
    | RentalRepository
    | ReturnSlotRepository
    | ReturnConfirmationRepository
    | BikeRepository
    | SubscriptionQueryRepository
    | SubscriptionCommandRepository
    | SubscriptionQueryServiceTag
    | SubscriptionCommandServiceTag;

export function makeRentalTestLayer(client: PrismaClient) {
  const rentalRepo = makeRentalRepository(client);
  const returnSlotRepo = makeReturnSlotRepository(client);
  const returnConfirmationRepo = makeReturnConfirmationRepository(client);
  const bikeRepo = makeBikeRepository(client);
  const subscriptionQueryRepo = makeSubscriptionQueryRepository(client);
  const subscriptionCommandRepo = makeSubscriptionCommandRepository(client);

  const prismaLayer = Layer.succeed(Prisma, Prisma.make({ client }));
  const subscriptionQueryRepoLayer = Layer.succeed(
    SubscriptionQueryRepository,
    SubscriptionQueryRepository.make(subscriptionQueryRepo),
  );
  const subscriptionCommandRepoLayer = Layer.succeed(
    SubscriptionCommandRepository,
    SubscriptionCommandRepository.make(subscriptionCommandRepo),
  );
  const subscriptionQueryServiceLayer = SubscriptionQueryServiceLive.pipe(
    Layer.provide(subscriptionQueryRepoLayer),
  );
  const subscriptionCommandServiceLayer = SubscriptionCommandServiceLive.pipe(
    Layer.provide(Layer.mergeAll(subscriptionQueryRepoLayer, subscriptionCommandRepoLayer)),
  );

  return Layer.mergeAll(
    prismaLayer,
    Layer.succeed(RentalRepository, RentalRepository.make(rentalRepo)),
    Layer.succeed(ReturnSlotRepository, ReturnSlotRepository.make(returnSlotRepo)),
    Layer.succeed(
      ReturnConfirmationRepository,
      ReturnConfirmationRepository.make(returnConfirmationRepo),
    ),
    Layer.succeed(BikeRepository, BikeRepository.make(bikeRepo)),
    subscriptionQueryRepoLayer,
    subscriptionCommandRepoLayer,
    subscriptionQueryServiceLayer,
    subscriptionCommandServiceLayer,
  );
}

export function makeRentalRunners(layer: Layer.Layer<any>) {
  return {
    start(args: StartRentalInput) {
      return runEffectEitherWithLayer(
        startRental({
          ...args,
          now: args.now ?? DEFAULT_TEST_NOW,
        }),
        layer,
      );
    },
    createReturnSlot(args: {
      rentalId: string;
      userId: string;
      stationId: string;
      now?: Date;
    }) {
      return runEffectEitherWithLayer(
        createReturnSlot({
          ...args,
          now: args.now ?? DEFAULT_TEST_NOW,
        }),
        layer,
      );
    },
    getCurrentReturnSlot(args: {
      rentalId: string;
      userId: string;
      now?: Date;
    }) {
      return runEffectWithLayer(
        getCurrentReturnSlot(args),
        layer,
      );
    },
    getCurrentReturnSlotEither(args: {
      rentalId: string;
      userId: string;
      now?: Date;
    }) {
      return runEffectEitherWithLayer(
        getCurrentReturnSlot(args),
        layer,
      );
    },
    cancelReturnSlot(args: {
      rentalId: string;
      userId: string;
      now?: Date;
    }) {
      return runEffectEitherWithLayer(
        cancelReturnSlot(args),
        layer,
      );
    },
    confirmReturn(args: ConfirmRentalReturnInput) {
      return runEffectEitherWithLayer(
        confirmRentalReturnByOperator({
          ...args,
          now: args.now ?? DEFAULT_TEST_NOW,
        }),
        layer,
      );
    },
  };
}
