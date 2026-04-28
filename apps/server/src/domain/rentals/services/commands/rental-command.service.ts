import type { Option } from "effect";

import { Effect, Layer } from "effect";

import { BikeRepository } from "@/domain/bikes";
import { Prisma } from "@/infrastructure/prisma";

import type { RentalServiceFailure } from "../../domain-errors";
import type { RentalRow, ReturnSlotRow } from "../../models";
import type { ConfirmRentalReturnInput } from "../../types";
import type { ReturnSlotFailure } from "./return-slot.service";

import { RentalRepository } from "../../repository/rental.repository";
import { ReturnSlotRepository } from "../../repository/return-slot.repository";
import {
  confirmRentalReturnByOperator,
} from "./confirm-return.service";
import {
  cancelReturnSlot,
  createReturnSlot,
  getCurrentReturnSlot,
} from "./return-slot.service";

type CreateReturnSlotInput = {
  rentalId: string;
  userId: string;
  stationId: string;
  now?: Date;
};

type RentalScopedInput = {
  rentalId: string;
  userId: string;
  now?: Date;
};

export type RentalCommandService = {
  createReturnSlot: (
    input: CreateReturnSlotInput,
  ) => Effect.Effect<ReturnSlotRow, ReturnSlotFailure>;
  getCurrentReturnSlot: (
    input: RentalScopedInput,
  ) => Effect.Effect<Option.Option<ReturnSlotRow>, ReturnSlotFailure>;
  cancelReturnSlot: (
    input: RentalScopedInput,
  ) => Effect.Effect<ReturnSlotRow, ReturnSlotFailure>;
  confirmReturnByOperator: (
    input: ConfirmRentalReturnInput,
  ) => Effect.Effect<RentalRow, RentalServiceFailure>;
};

type RentalCommandDeps = {
  prisma: typeof Prisma.Service;
  rentalRepository: typeof RentalRepository.Service;
  returnSlotRepository: typeof ReturnSlotRepository.Service;
  bikeRepository: typeof BikeRepository.Service;
};

function provideRentalCommandDeps<A, E>(
  effect: Effect.Effect<
    A,
    E,
    | Prisma
    | RentalRepository
    | ReturnSlotRepository
    | BikeRepository
  >,
  deps: RentalCommandDeps,
): Effect.Effect<A, E> {
  return effect.pipe(
    Effect.provideService(BikeRepository, deps.bikeRepository),
    Effect.provideService(ReturnSlotRepository, deps.returnSlotRepository),
    Effect.provideService(RentalRepository, deps.rentalRepository),
    Effect.provideService(Prisma, deps.prisma),
  );
}

export function makeRentalCommandService(
  deps: RentalCommandDeps,
): RentalCommandService {
  return {
    createReturnSlot: input =>
      provideRentalCommandDeps(createReturnSlot(input), deps),

    getCurrentReturnSlot: input =>
      provideRentalCommandDeps(getCurrentReturnSlot(input), deps),

    cancelReturnSlot: input =>
      provideRentalCommandDeps(cancelReturnSlot(input), deps),

    confirmReturnByOperator: input =>
      provideRentalCommandDeps(confirmRentalReturnByOperator(input), deps),
  };
}

const makeRentalCommandServiceEffect = Effect.gen(function* () {
  const prisma = yield* Prisma;
  const rentalRepository = yield* RentalRepository;
  const returnSlotRepository = yield* ReturnSlotRepository;
  const bikeRepository = yield* BikeRepository;

  return makeRentalCommandService({
    prisma,
    rentalRepository,
    returnSlotRepository,
    bikeRepository,
  });
});

export class RentalCommandServiceTag extends Effect.Service<RentalCommandServiceTag>()(
  "RentalCommandService",
  {
    effect: makeRentalCommandServiceEffect,
  },
) {}

export const RentalCommandServiceLive = Layer.effect(
  RentalCommandServiceTag,
  makeRentalCommandServiceEffect.pipe(Effect.map(RentalCommandServiceTag.make)),
);
