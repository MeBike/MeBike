import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { ReservationRepo } from "../reservation.repository.types";

import { ReservationRepositoryError } from "../../domain-errors";
import { selectReservationRow, toReservationRow } from "../reservation.mappers";
import {
  pendingHoldWhere,
  pendingStatusWhere,
} from "../reservation.queries";

export type ReservationHoldReadRepo = Pick<
  ReservationRepo,
  | "findLatestPendingOrActiveByBikeId"
  | "findPendingHoldByUserIdNow"
  | "findPendingHoldByBikeIdNow"
>;

export function makeReservationHoldReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): ReservationHoldReadRepo {
  return {
    findLatestPendingOrActiveByBikeId: bikeId =>
      Effect.tryPromise({
        try: () =>
          client.reservation.findFirst({
            where: {
              bikeId,
              ...pendingStatusWhere(),
            },
            orderBy: { updatedAt: "desc" },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findLatestPendingOrActiveByBikeId",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
      ),

    findPendingHoldByUserIdNow: (userId, now) =>
      Effect.tryPromise({
        try: () =>
          client.reservation.findFirst({
            where: {
              userId,
              ...pendingHoldWhere(now),
            },
            orderBy: { endTime: "asc" },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findPendingHoldByUserIdNow",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
      ),

    findPendingHoldByBikeIdNow: (bikeId, now) =>
      Effect.tryPromise({
        try: () =>
          client.reservation.findFirst({
            where: {
              bikeId,
              ...pendingHoldWhere(now),
            },
            orderBy: { endTime: "asc" },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findPendingHoldByBikeIdNow",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
      ),
  };
}
