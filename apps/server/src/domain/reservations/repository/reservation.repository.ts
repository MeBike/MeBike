import { Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { ReservationRepo } from "./reservation.repository.types";

import { makeReservationCommandRepository } from "./reservation-command.repository";
import { makeReservationQueryRepository } from "./reservation-query.repository";

export type { ReservationRepo } from "./reservation.repository.types";

const makeReservationRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeReservationRepository(client);
});

export class ReservationRepository extends Effect.Service<ReservationRepository>()(
  "ReservationRepository",
  {
    effect: makeReservationRepositoryEffect,
  },
) {}

export function makeReservationRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): ReservationRepo {
  return {
    ...makeReservationQueryRepository(client),
    ...makeReservationCommandRepository(client),
  };
}

export const reservationRepositoryFactory = makeReservationRepository;

export const ReservationRepositoryLive = Layer.effect(
  ReservationRepository,
  makeReservationRepositoryEffect.pipe(Effect.map(ReservationRepository.make)),
);
