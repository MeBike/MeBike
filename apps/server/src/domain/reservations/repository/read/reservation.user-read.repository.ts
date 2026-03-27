import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { ReservationStatus } from "generated/prisma/client";

import type { ReservationRepo } from "../reservation.repository.types";

import { ReservationRepositoryError } from "../../domain-errors";
import { selectReservationRow, toReservationRow } from "../reservation.mappers";
import {
  pendingOrLegacyActiveStatusWhere,
  toReservationOrderBy,
  toReservationWhereForUser,
} from "../reservation.queries";

export type ReservationUserReadRepo = Pick<
  ReservationRepo,
  | "findLatestPendingOrActiveByUserId"
  | "findActiveByUserId"
  | "findNextUpcomingByUserId"
  | "listForUser"
>;

export function makeReservationUserReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): ReservationUserReadRepo {
  const findNextUpcomingByUserIdWithClient = (
    tx: PrismaClient | PrismaTypes.TransactionClient,
    userId: string,
    now: Date,
    options?: { readonly onlyFixedSlot?: boolean },
  ) =>
    Effect.tryPromise({
      try: () =>
        tx.reservation.findFirst({
          where: {
            userId,
            status: ReservationStatus.PENDING,
            startTime: { gt: now },
            ...(options?.onlyFixedSlot
              ? { fixedSlotTemplateId: { not: null } }
              : {}),
          },
          orderBy: { startTime: "asc" },
          select: selectReservationRow,
        }),
      catch: err =>
        new ReservationRepositoryError({
          operation: "findNextUpcomingByUserId",
          cause: err,
        }),
    }).pipe(
      Effect.map(row => Option.fromNullable(row).pipe(Option.map(toReservationRow))),
    );

  return {
    findLatestPendingOrActiveByUserId: userId =>
      Effect.tryPromise({
        try: () =>
          client.reservation.findFirst({
            where: {
              userId,
              ...pendingOrLegacyActiveStatusWhere(),
            },
            orderBy: { updatedAt: "desc" },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findLatestPendingOrActiveByUserId",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
      ),

    findActiveByUserId: userId =>
      Effect.tryPromise({
        try: () =>
          client.reservation.findFirst({
            where: {
              userId,
              status: ReservationStatus.ACTIVE,
            },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findActiveByUserId",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
      ),

    findNextUpcomingByUserId: (userId, now, options) =>
      findNextUpcomingByUserIdWithClient(client, userId, now, options),

    listForUser: (userId, filter, pageReq) =>
      Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);
        const where = toReservationWhereForUser(userId, filter);
        const orderBy = toReservationOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.reservation.count({ where }),
            catch: err =>
              new ReservationRepositoryError({
                operation: "listForUser.count",
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.reservation.findMany({
                where,
                skip,
                take,
                orderBy,
                select: selectReservationRow,
              }),
            catch: err =>
              new ReservationRepositoryError({
                operation: "listForUser.findMany",
                cause: err,
              }),
          }),
        ]);

        const rows = items.map(toReservationRow);
        return makePageResult(rows, total, page, pageSize);
      }),
  };
}
