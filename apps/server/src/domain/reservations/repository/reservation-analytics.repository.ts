import { Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { ReservationAnalyticsRepo } from "./reservation-analytics.repository.types";

import { ReservationRepositoryError } from "../domain-errors";

export type { ReservationAnalyticsRepo } from "./reservation-analytics.repository.types";

export function makeReservationAnalyticsRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): ReservationAnalyticsRepo {
  const client = db;

  return {
    getGlobalReservationCounts() {
      return Effect.tryPromise({
        try: async () => {
          const rows = await client.reservation.groupBy({
            by: ["status"],
            _count: { _all: true },
          });

          return rows.map(row => ({
            status: row.status,
            count: row._count._all,
          }));
        },
        catch: cause =>
          new ReservationRepositoryError({
            operation: "getGlobalReservationCounts",
            cause,
          }),
      });
    },
  };
}

const makeReservationAnalyticsRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeReservationAnalyticsRepository(client);
});

export class ReservationAnalyticsRepository extends Effect.Service<ReservationAnalyticsRepository>()(
  "ReservationAnalyticsRepository",
  {
    effect: makeReservationAnalyticsRepositoryEffect,
  },
) {}

export const ReservationAnalyticsRepositoryLive = Layer.effect(
  ReservationAnalyticsRepository,
  makeReservationAnalyticsRepositoryEffect.pipe(
    Effect.map(ReservationAnalyticsRepository.make),
  ),
);
