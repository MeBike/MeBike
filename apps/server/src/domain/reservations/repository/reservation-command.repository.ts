import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { ReservationCommandRepo } from "./reservation.repository.types";

import { makeReservationWriteRepository } from "./write/reservation.write.repository";

export type { ReservationCommandRepo } from "./reservation.repository.types";

const makeReservationCommandRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeReservationCommandRepository(client);
});

export class ReservationCommandRepository extends Effect.Service<ReservationCommandRepository>()(
  "ReservationCommandRepository",
  {
    effect: makeReservationCommandRepositoryEffect,
  },
) {}

export function makeReservationCommandRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): ReservationCommandRepo {
  return makeReservationWriteRepository(client);
}

export const ReservationCommandRepositoryLive = Layer.effect(
  ReservationCommandRepository,
  makeReservationCommandRepositoryEffect.pipe(Effect.map(ReservationCommandRepository.make)),
);
