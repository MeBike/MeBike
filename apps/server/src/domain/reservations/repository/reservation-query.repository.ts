import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { ReservationQueryRepo } from "./reservation.repository.types";

import { makeReservationReadRepository } from "./read/reservation.read.repository";

export type { ReservationQueryRepo } from "./reservation.repository.types";

const makeReservationQueryRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeReservationQueryRepository(client);
});

export class ReservationQueryRepository extends Effect.Service<ReservationQueryRepository>()(
  "ReservationQueryRepository",
  {
    effect: makeReservationQueryRepositoryEffect,
  },
) {}

export function makeReservationQueryRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): ReservationQueryRepo {
  return makeReservationReadRepository(client);
}

export const ReservationQueryRepositoryLive = Layer.effect(
  ReservationQueryRepository,
  makeReservationQueryRepositoryEffect.pipe(Effect.map(ReservationQueryRepository.make)),
);
