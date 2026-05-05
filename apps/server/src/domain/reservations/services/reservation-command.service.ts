import { Effect, Layer } from "effect";

import { SubscriptionCommandServiceTag } from "@/domain/subscriptions";
import { WalletCommandServiceTag } from "@/domain/wallets";
import { Prisma } from "@/infrastructure/prisma";

import type { ReservationRow } from "../models";
import type {
  CancelReservationFailure,
  CancelReservationInput,
} from "./commands/cancel-reservation.service";
import type {
  ConfirmReservationFailure,
  ConfirmReservationInput,
} from "./commands/confirm-reservation.service";
import type {
  ReserveBikeFailure,
  ReserveBikeInput,
} from "./commands/reserve-bike.service";

import { cancelReservation } from "./commands/cancel-reservation.service";
import { confirmReservation } from "./commands/confirm-reservation.service";
import { reserveBike } from "./commands/reserve-bike.service";

export type ReservationCommandService = {
  reserveBike: (
    input: ReserveBikeInput,
  ) => Effect.Effect<ReservationRow, ReserveBikeFailure>;
  confirmReservation: (
    input: ConfirmReservationInput,
  ) => Effect.Effect<ReservationRow, ConfirmReservationFailure>;
  cancelReservation: (
    input: CancelReservationInput,
  ) => Effect.Effect<ReservationRow, CancelReservationFailure>;
};

type ReservationCommandDeps = {
  prisma: typeof Prisma.Service;
  subscriptionCommandService: typeof SubscriptionCommandServiceTag.Service;
  walletCommandService: typeof WalletCommandServiceTag.Service;
};

function provideReservationCommandDeps<A, E>(
  effect: Effect.Effect<
    A,
    E,
    Prisma | SubscriptionCommandServiceTag | WalletCommandServiceTag
  >,
  deps: ReservationCommandDeps,
): Effect.Effect<A, E> {
  return effect.pipe(
    Effect.provideService(WalletCommandServiceTag, deps.walletCommandService),
    Effect.provideService(SubscriptionCommandServiceTag, deps.subscriptionCommandService),
    Effect.provideService(Prisma, deps.prisma),
  );
}

export function makeReservationCommandService(
  deps: ReservationCommandDeps,
): ReservationCommandService {
  return {
    reserveBike: input =>
      provideReservationCommandDeps(reserveBike(input), deps),
    confirmReservation: input =>
      provideReservationCommandDeps(confirmReservation(input), deps),
    cancelReservation: input =>
      provideReservationCommandDeps(cancelReservation(input), deps),
  };
}

const makeReservationCommandServiceEffect = Effect.gen(function* () {
  const prisma = yield* Prisma;
  const subscriptionCommandService = yield* SubscriptionCommandServiceTag;
  const walletCommandService = yield* WalletCommandServiceTag;

  return makeReservationCommandService({
    prisma,
    subscriptionCommandService,
    walletCommandService,
  });
});

export class ReservationCommandServiceTag extends Effect.Service<ReservationCommandServiceTag>()(
  "ReservationCommandService",
  {
    effect: makeReservationCommandServiceEffect,
  },
) {}

export const ReservationCommandServiceLive = Layer.effect(
  ReservationCommandServiceTag,
  makeReservationCommandServiceEffect.pipe(Effect.map(ReservationCommandServiceTag.make)),
);
