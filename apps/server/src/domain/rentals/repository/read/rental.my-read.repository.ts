import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { makePageResult, normalizedPage } from "@/domain/shared/pagination";

import type { RentalRepo } from "../rental.repository.types";

import { RentalRepositoryError } from "../../domain-errors";
import {
  mapToRentalBillingDetailRow,
  mapToRentalRow,
  rentalBillingDetailSelect,
  rentalSelect,
  toMyRentalsWhere,
  toRentalOrderBy,
} from "../rental.repository.query";

export type RentalMyReadRepo = Pick<
  RentalRepo,
  | "listMyRentals"
  | "listMyCurrentRentals"
  | "getMyRentalById"
  | "getMyRentalBillingDetail"
  | "getMyRentalCounts"
>;

export function makeRentalMyReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RentalMyReadRepo {
  const select = rentalSelect;

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
      }).pipe(defectOn(RentalRepositoryError));
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
      }).pipe(defectOn(RentalRepositoryError));
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
      }).pipe(defectOn(RentalRepositoryError));
    },

    getMyRentalBillingDetail(userId, rentalId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.rentalBillingRecord.findFirst({
              where: {
                rentalId,
                rental: {
                  is: {
                    id: rentalId,
                    userId,
                  },
                },
              },
              select: rentalBillingDetailSelect,
            }),
          catch: e =>
            new RentalRepositoryError({
              operation: "getMyRentalBillingDetail",
              cause: e,
            }),
        });

        return Option.fromNullable(raw).pipe(
          Option.map(mapToRentalBillingDetailRow),
        );
      }).pipe(defectOn(RentalRepositoryError));
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
      }).pipe(defectOn(RentalRepositoryError));
    },
  };
}
