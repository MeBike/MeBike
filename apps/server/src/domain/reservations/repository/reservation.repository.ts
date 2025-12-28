import { Context, Effect, Layer, Match, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";
import { isPrismaRecordNotFound, isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";
import { uniqueTargets } from "@/infrastructure/prisma-unique-violation";
import { ReservationStatus } from "generated/prisma/client";

import type { CreateReservationInput, UpdateReservationStatusInput } from "../types";
import type { ReservationRepo } from "./reservation.repository.types";

import {
  ReservationNotFound,
  ReservationRepositoryError,
  ReservationUniqueViolation,
} from "../domain-errors";
import { selectReservationRow, toReservationRow } from "./reservation.mappers";
import {
  activeStatusWhere,
  pendingHoldWhere,
  toReservationOrderBy,
  toReservationWhereForUser,
} from "./reservation.queries";

export type { ReservationRepo } from "./reservation.repository.types";

export class ReservationRepository extends Context.Tag("ReservationRepository")<
  ReservationRepository,
  ReservationRepo
>() {}

export function makeReservationRepository(client: PrismaClient): ReservationRepo {
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
            ...(options?.onlyFixedSlot ? { fixedSlotTemplateId: { not: null } } : {}),
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

  const updateStatusWithClient = (
    tx: PrismaClient | PrismaTypes.TransactionClient,
    input: UpdateReservationStatusInput,
  ) =>
    Effect.tryPromise({
      try: () =>
        tx.reservation.update({
          where: { id: input.reservationId },
          data: {
            status: input.status,
            updatedAt: input.updatedAt ?? new Date(),
          },
          select: selectReservationRow,
        }),
      catch: err =>
        Match.value(err).pipe(
          Match.when(isPrismaRecordNotFound, () =>
            new ReservationNotFound({ reservationId: input.reservationId })),
          Match.orElse(error =>
            new ReservationRepositoryError({
              operation: "updateStatus",
              cause: error,
            })),
        ),
    }).pipe(Effect.map(toReservationRow));

  const createReservationWithClient = (
    tx: PrismaClient | PrismaTypes.TransactionClient,
    input: CreateReservationInput,
  ) =>
    Effect.tryPromise({
      try: () =>
        tx.reservation.create({
          data: {
            userId: input.userId,
            bikeId: input.bikeId ?? null,
            stationId: input.stationId,
            reservationOption: input.reservationOption,
            fixedSlotTemplateId: input.fixedSlotTemplateId ?? null,
            subscriptionId: input.subscriptionId ?? null,
            startTime: input.startTime,
            endTime: input.endTime ?? null,
            prepaid: input.prepaid,
            status: input.status ?? ReservationStatus.PENDING,
          },
          select: selectReservationRow,
        }),
      catch: error =>
        Match.value(error).pipe(
          Match.when(isPrismaUniqueViolation, e =>
            new ReservationUniqueViolation({
              operation: "createReservation",
              constraint: uniqueTargets(e),
              cause: e,
            })),
          Match.orElse(e =>
            new ReservationRepositoryError({
              operation: "createReservation",
              cause: e,
            })),
        ),
    }).pipe(Effect.map(toReservationRow));

  return {
    createReservation: input => createReservationWithClient(client, input),

    createReservationInTx: (tx, input) => createReservationWithClient(tx, input),

    findById: reservationId =>
      Effect.tryPromise({
        try: () =>
          client.reservation.findUnique({
            where: { id: reservationId },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findById",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
      ),

    findByIdInTx: (tx, reservationId) =>
      Effect.tryPromise({
        try: () =>
          tx.reservation.findUnique({
            where: { id: reservationId },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findByIdInTx",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
      ),

    findLatestPendingOrActiveByUserId: userId =>
      Effect.tryPromise({
        try: () =>
          client.reservation.findFirst({
            where: {
              userId,
              ...activeStatusWhere(),
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

    findLatestPendingOrActiveByBikeId: bikeId =>
      Effect.tryPromise({
        try: () =>
          client.reservation.findFirst({
            where: {
              bikeId,
              ...activeStatusWhere(),
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

    findLatestPendingOrActiveByUserIdInTx: (tx, userId) =>
      Effect.tryPromise({
        try: () =>
          tx.reservation.findFirst({
            where: {
              userId,
              ...activeStatusWhere(),
            },
            orderBy: { updatedAt: "desc" },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findLatestPendingOrActiveByUserIdInTx",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
      ),

    findLatestPendingOrActiveByBikeIdInTx: (tx, bikeId) =>
      Effect.tryPromise({
        try: () =>
          tx.reservation.findFirst({
            where: {
              bikeId,
              ...activeStatusWhere(),
            },
            orderBy: { updatedAt: "desc" },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findLatestPendingOrActiveByBikeIdInTx",
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

    findPendingHoldByUserIdNowInTx: (tx, userId, now) =>
      Effect.tryPromise({
        try: () =>
          tx.reservation.findFirst({
            where: {
              userId,
              ...pendingHoldWhere(now),
            },
            orderBy: { endTime: "asc" },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findPendingHoldByUserIdNowInTx",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
      ),

    findPendingHoldByBikeIdNowInTx: (tx, bikeId, now) =>
      Effect.tryPromise({
        try: () =>
          tx.reservation.findFirst({
            where: {
              bikeId,
              ...pendingHoldWhere(now),
            },
            orderBy: { endTime: "asc" },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findPendingHoldByBikeIdNowInTx",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
      ),

    findActiveByUserIdInTx: (tx, userId) =>
      Effect.tryPromise({
        try: () =>
          tx.reservation.findFirst({
            where: {
              userId,
              status: ReservationStatus.ACTIVE,
            },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findActiveByUserIdInTx",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
      ),

    findPendingFixedSlotByTemplateAndStartInTx: (tx, templateId, startTime) =>
      Effect.tryPromise({
        try: () =>
          tx.reservation.findFirst({
            where: {
              fixedSlotTemplateId: templateId,
              reservationOption: "FIXED_SLOT",
              startTime,
              status: ReservationStatus.PENDING,
              bikeId: null,
            },
            select: selectReservationRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findPendingFixedSlotByTemplateAndStartInTx",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
      ),

    assignBikeToPendingReservationInTx: (tx, reservationId, bikeId, updatedAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await tx.reservation.updateMany({
            where: {
              id: reservationId,
              bikeId: null,
              status: ReservationStatus.PENDING,
            },
            data: {
              bikeId,
              updatedAt,
            },
          });
          return updated.count > 0;
        },
        catch: err =>
          new ReservationRepositoryError({
            operation: "assignBikeToPendingReservationInTx",
            cause: err,
          }),
      }),

    findNextUpcomingByUserId: (userId, now, options) =>
      findNextUpcomingByUserIdWithClient(client, userId, now, options),

    findNextUpcomingByUserIdInTx: (tx, userId, now, options) =>
      findNextUpcomingByUserIdWithClient(tx, userId, now, options),

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

    updateStatus: input => updateStatusWithClient(client, input),

    updateStatusInTx: (tx, input) => updateStatusWithClient(tx, input),

    expirePendingHoldInTx: (tx, reservationId, now) =>
      Effect.tryPromise({
        try: async () => {
          const result = await tx.reservation.updateMany({
            where: {
              id: reservationId,
              status: ReservationStatus.PENDING,
              endTime: { lt: now },
            },
            data: { status: ReservationStatus.EXPIRED, updatedAt: now },
          });
          return result.count > 0;
        },
        catch: err =>
          new ReservationRepositoryError({
            operation: "expirePendingHoldInTx",
            cause: err,
          }),
      }),

    markExpiredNow: now =>
      Effect.tryPromise({
        try: () =>
          client.reservation.updateMany({
            where: {
              status: ReservationStatus.PENDING,
              endTime: { lt: now },
            },
            data: { status: ReservationStatus.EXPIRED, updatedAt: now },
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "markExpiredNow",
            cause: err,
          }),
      }).pipe(Effect.map(result => result.count)),
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
