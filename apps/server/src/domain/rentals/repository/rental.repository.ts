import { Effect, Layer, Match, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes, RentalStatus } from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";
import { uniqueTargets } from "@/infrastructure/prisma-unique-violation";

import type {
  AdminRentalListItem,
} from "../models";
import type {
  CreateRentalInput,
  RentalRepo,
} from "./rental.repository.types";

import { RentalRepositoryError, RentalUniqueViolation } from "../domain-errors";
import {
  adminRentalDetailSelect,
  adminRentalListSelect,
  mapToAdminRentalDetail,
  mapToAdminRentalListItem,
} from "./rental.repository.admin.query";
import {
  mapToRentalRow,
  rentalSelect,
  toAdminRentalsWhere,
  toMyRentalsWhere,
  toRentalOrderBy,
} from "./rental.repository.query";

export type {
  CreateRentalInput,
  CreateReservedRentalInput,
  RentalRepo,
  UpdateRentalOnEndInput,
} from "./rental.repository.types";

export function makeRentalRepository(client: PrismaClient): RentalRepo {
  const select = rentalSelect;

  const createRentalWithClient = (
    tx: PrismaClient | PrismaTypes.TransactionClient,
    data: CreateRentalInput,
  ) =>
    Effect.tryPromise({
      try: () =>
        tx.rental.create({
          data: {
            userId: data.userId,
            bikeId: data.bikeId,
            startStationId: data.startStationId,
            startTime: data.startTime,
            subscriptionId: data.subscriptionId ?? null,
            status: "RENTED" as RentalStatus,
          },
          select,
        }),
      catch: error =>
        Match.value(error).pipe(
          Match.when(isPrismaUniqueViolation, e =>
            new RentalUniqueViolation({
              operation: "createRental",
              constraint: uniqueTargets(e),
              cause: e,
            })),
          Match.orElse(e =>
            new RentalRepositoryError({
              operation: "createRental",
              cause: e,
            })),
        ),
    }).pipe(Effect.map(mapToRentalRow));

  return {
    listMyRentals(userId, filter, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where = toMyRentalsWhere(userId, filter);
        const orderBy = toRentalOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.rental.count({ where }),
            catch: e =>
              new RentalRepositoryError({
                operation: "listMyRentals.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.rental.findMany({
                where,
                skip,
                take,
                orderBy,
                select,
              }),
            catch: e =>
              new RentalRepositoryError({
                operation: "listMyRentals.findMany",
                cause: e,
              }),
          }),
        ]);

        const mappedItems = items.map(mapToRentalRow);

        return makePageResult(mappedItems, total, page, pageSize);
      });
    },

    listMyCurrentRentals(userId, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where = toMyRentalsWhere(userId, { status: "RENTED" });
        const orderBy = toRentalOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.rental.count({ where }),
            catch: e =>
              new RentalRepositoryError({
                operation: "listMyCurrentRentals.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.rental.findMany({
                where,
                skip,
                take,
                orderBy,
                select,
              }),
            catch: e =>
              new RentalRepositoryError({
                operation: "listMyCurrentRentals.findMany",
                cause: e,
              }),
          }),
        ]);

        const mappedItems = items.map(mapToRentalRow);

        return makePageResult(mappedItems, total, page, pageSize);
      });
    },

    getMyRentalById(userId, rentalId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.rental.findFirst({
              where: { id: rentalId, userId },
              select,
            }),
          catch: e =>
            new RentalRepositoryError({
              operation: "getMyRentalById",
              cause: e,
            }),
        });

        return Option.fromNullable(raw).pipe(Option.map(mapToRentalRow));
      });
    },

    getMyRentalCounts(userId) {
      return Effect.tryPromise({
        try: async () => {
          const rows = await client.rental.groupBy({
            by: ["status"],
            _count: { _all: true },
            where: { userId },
          });
          return rows.map(row => ({
            status: row.status,
            count: row._count._all,
          }));
        },
        catch: e =>
          new RentalRepositoryError({
            operation: "getMyRentalCounts",
            cause: e,
          }),
      });
    },

    findActiveByBikeId(bikeId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.rental.findFirst({
              where: { bikeId, status: "RENTED" as RentalStatus },
              select,
            }),
          catch: e =>
            new RentalRepositoryError({
              operation: "findActiveByBikeId",
              cause: e,
            }),
        });

        return Option.fromNullable(raw).pipe(Option.map(mapToRentalRow));
      });
    },

    findActiveByUserId(userId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.rental.findFirst({
              where: { userId, status: "RENTED" as RentalStatus },
              select,
            }),
          catch: e =>
            new RentalRepositoryError({
              operation: "findActiveByUserId",
              cause: e,
            }),
        });

        return Option.fromNullable(raw).pipe(Option.map(mapToRentalRow));
      });
    },

    findActiveByBikeIdInTx(tx, bikeId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            tx.rental.findFirst({
              where: { bikeId, status: "RENTED" },
              select,
            }),
          catch: e =>
            new RentalRepositoryError({
              operation: "findActiveByBikeIdInTx",
              cause: e,
            }),
        });

        return Option.fromNullable(raw).pipe(Option.map(mapToRentalRow));
      });
    },

    findActiveByUserIdInTx(tx, userId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            tx.rental.findFirst({
              where: { userId, status: "RENTED" },
              select,
            }),
          catch: e =>
            new RentalRepositoryError({
              operation: "findActiveByUserIdInTx",
              cause: e,
            }),
        });

        return Option.fromNullable(raw).pipe(Option.map(mapToRentalRow));
      });
    },

    createRental(data) {
      return createRentalWithClient(client, data);
    },

    createRentalInTx(tx, data) {
      return createRentalWithClient(tx, data);
    },

    createReservedRentalForReservationInTx(tx, data) {
      return Effect.tryPromise({
        try: () =>
          tx.rental.create({
            data: {
              id: data.reservationId,
              userId: data.userId,
              bikeId: data.bikeId,
              startStationId: data.startStationId,
              startTime: data.startTime,
              status: "RESERVED",
              subscriptionId: data.subscriptionId ?? null,
            },
            select,
          }),
        catch: error =>
          Match.value(error).pipe(
            Match.when(isPrismaUniqueViolation, e =>
              new RentalUniqueViolation({
                operation: "createReservedRentalForReservationInTx",
                constraint: uniqueTargets(e),
                cause: e,
              })),
            Match.orElse(e =>
              new RentalRepositoryError({
                operation: "createReservedRentalForReservationInTx",
                cause: e,
              })),
          ),
      }).pipe(Effect.map(mapToRentalRow));
    },

    updateRentalOnEnd(data) {
      return Effect.tryPromise({
        try: () =>
          client.rental.update({
            where: { id: data.rentalId },
            data: {
              endStationId: data.endStationId,
              endTime: data.endTime,
              duration: data.durationMinutes,
              totalPrice: data.totalPrice === null ? null : String(data.totalPrice),
              status: data.newStatus,
            },
            select,
          }),
        catch: e =>
          new RentalRepositoryError({
            operation: "updateRentalOnEnd",
            cause: e,
          }),
      }).pipe(Effect.map(mapToRentalRow));
    },

    updateRentalOnEndInTx(tx, data) {
      return Effect.tryPromise({
        try: async () => {
          const updated = await tx.rental.updateMany({
            where: {
              id: data.rentalId,
              status: "RENTED",
            },
            data: {
              endStationId: data.endStationId,
              endTime: data.endTime,
              duration: data.durationMinutes,
              totalPrice: data.totalPrice === null ? null : String(data.totalPrice),
              status: data.newStatus,
            },
          });

          if (updated.count === 0) {
            return null;
          }

          return await tx.rental.findUnique({
            where: { id: data.rentalId },
            select,
          });
        },
        catch: e =>
          new RentalRepositoryError({
            operation: "updateRentalOnEndInTx",
            cause: e,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(mapToRentalRow)),
        ),
      );
    },

    findById(rentalId) {
      return Effect.tryPromise({
        try: () =>
          client.rental.findUnique({
            where: { id: rentalId },
            select,
          }),
        catch: e =>
          new RentalRepositoryError({
            operation: "findById",
            cause: e,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(mapToRentalRow)),
        ),
      );
    },

    assignBikeToReservedRentalInTx(tx, rentalId, bikeId, updatedAt) {
      return Effect.tryPromise({
        try: async () => {
          const updated = await tx.rental.updateMany({
            where: {
              id: rentalId,
              bikeId: null,
              status: "RESERVED",
            },
            data: {
              bikeId,
              updatedAt,
            },
          });
          return updated.count > 0;
        },
        catch: e =>
          new RentalRepositoryError({
            operation: "assignBikeToReservedRentalInTx",
            cause: e,
          }),
      });
    },

    startReservedRentalInTx(tx, rentalId, startTime, updatedAt, subscriptionId) {
      return Effect.tryPromise({
        try: async () => {
          const updated = await tx.rental.updateMany({
            where: {
              id: rentalId,
              status: "RESERVED",
            },
            data: {
              status: "RENTED",
              startTime,
              updatedAt,
              subscriptionId,
            },
          });
          return updated.count > 0;
        },
        catch: e =>
          new RentalRepositoryError({
            operation: "startReservedRentalInTx",
            cause: e,
          }),
      });
    },

    cancelReservedRentalInTx(tx, rentalId, updatedAt) {
      return Effect.tryPromise({
        try: async () => {
          const updated = await tx.rental.updateMany({
            where: {
              id: rentalId,
              status: "RESERVED",
            },
            data: {
              status: "CANCELLED",
              updatedAt,
            },
          });
          return updated.count > 0;
        },
        catch: e =>
          new RentalRepositoryError({
            operation: "cancelReservedRentalInTx",
            cause: e,
          }),
      });
    },

    adminListRentals(filter, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where = toAdminRentalsWhere(filter);
        const orderBy = toRentalOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.rental.count({ where }),
            catch: e =>
              new RentalRepositoryError({
                operation: "adminListRentals.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.rental.findMany({
                where,
                skip,
                take,
                orderBy,
                select: adminRentalListSelect,
              }),
            catch: e =>
              new RentalRepositoryError({
                operation: "adminListRentals.findMany",
                cause: e,
              }),
          }),
        ]);

        const mappedItems: AdminRentalListItem[] = items.map(mapToAdminRentalListItem);

        return makePageResult(mappedItems, total, page, pageSize);
      });
    },

    adminGetRentalById(rentalId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.rental.findUnique({
              where: { id: rentalId },
              select: adminRentalDetailSelect,
            }),
          catch: e =>
            new RentalRepositoryError({
              operation: "adminGetRentalById",
              cause: e,
            }),
        });

        if (!raw) {
          return Option.none();
        }
        return Option.some(mapToAdminRentalDetail(raw));
      });
    },
  };
}

const makeRentalRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeRentalRepository(client);
});

export class RentalRepository extends Effect.Service<RentalRepository>()(
  "RentalRepository",
  {
    effect: makeRentalRepositoryEffect,
  },
) {}

export const RentalRepositoryLive = Layer.effect(
  RentalRepository,
  makeRentalRepositoryEffect.pipe(Effect.map(RentalRepository.make)),
);
