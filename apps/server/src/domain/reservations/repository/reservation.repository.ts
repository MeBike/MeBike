import { Context, Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { ReservationRepo } from "./reservation.repository.types";

import { makeReservationReadRepository } from "./read/reservation.read.repository";
import { makeReservationWriteRepository } from "./write/reservation.write.repository";

export type { ReservationRepo } from "./reservation.repository.types";

export class ReservationRepository extends Context.Tag("ReservationRepository")<
  ReservationRepository,
  ReservationRepo
>() {}

export function makeReservationRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): ReservationRepo {
  return {
    ...makeReservationReadRepository(client),
    ...makeReservationWriteRepository(client),
  };
}

export const reservationRepositoryFactory = makeReservationRepository;

export const ReservationRepositoryLive = Layer.effect(
  ReservationRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeReservationRepository(client);
  }),
);
