import { Layer } from "effect";

import type { ConfirmRentalReturnInput, StartRentalInput } from "@/domain/rentals/types";
import type {
  SubscriptionServiceTag,
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
  makeSubscriptionRepository,
  SubscriptionRepository,
  SubscriptionServiceLive,
} from "@/domain/subscriptions";
import { Prisma } from "@/infrastructure/prisma";
import { runEffectEitherWithLayer, runEffectWithLayer } from "@/test/effect/run";

export type RentalDeps
  = | Prisma
    | RentalRepository
    | ReturnSlotRepository
    | ReturnConfirmationRepository
    | BikeRepository
    | SubscriptionRepository
    | SubscriptionServiceTag;

export function makeRentalTestLayer(client: PrismaClient) {
  const rentalRepo = makeRentalRepository(client);
  const returnSlotRepo = makeReturnSlotRepository(client);
  const returnConfirmationRepo = makeReturnConfirmationRepository(client);
  const bikeRepo = makeBikeRepository(client);
  const subscriptionRepo = makeSubscriptionRepository(client);

  const prismaLayer = Layer.succeed(Prisma, Prisma.make({ client }));
  const subscriptionRepoLayer = Layer.succeed(SubscriptionRepository, subscriptionRepo);
  const subscriptionServiceLayer = SubscriptionServiceLive.pipe(
    Layer.provide(subscriptionRepoLayer),
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
    subscriptionRepoLayer,
    subscriptionServiceLayer,
  );
}

export function makeRentalRunners(layer: Layer.Layer<any>) {
  return {
    start(args: StartRentalInput) {
      return runEffectEitherWithLayer(
        startRental(args),
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
        createReturnSlot(args),
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
        confirmRentalReturnByOperator(args),
        layer,
      );
    },
  };
}
