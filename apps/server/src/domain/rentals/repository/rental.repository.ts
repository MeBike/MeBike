import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
  RentalStatus,
} from "../../../../generated/prisma/client";
import type {
  MyRentalFilter,
  RentalCountsRow,
  RentalRow,
  RentalSortField,
} from "../models";

import { RentalRepositoryError } from "../domain-errors";

export type RentalRepo = {
  // User "/me" views
  listMyRentals: (
    userId: string,
    filter: MyRentalFilter,
    pageReq: PageRequest<RentalSortField>,
  ) => Effect.Effect<PageResult<RentalRow>, RentalRepositoryError>;

  listMyCurrentRentals: (
    userId: string,
    pageReq: PageRequest<RentalSortField>,
  ) => Effect.Effect<PageResult<RentalRow>, RentalRepositoryError>;

  getMyRentalById: (
    userId: string,
    rentalId: string,
  ) => Effect.Effect<Option.Option<RentalRow>, RentalRepositoryError>;

  getMyRentalCounts: (
    userId: string,
  ) => Effect.Effect<readonly RentalCountsRow[], RentalRepositoryError>;

  // Helpers for future use-cases
  findActiveByBikeId: (
    bikeId: string,
  ) => Effect.Effect<Option.Option<RentalRow>, RentalRepositoryError>;

  findActiveByUserId: (
    userId: string,
  ) => Effect.Effect<Option.Option<RentalRow>, RentalRepositoryError>;
};

function toMyRentalsWhere(
  userId: string,
  filter: MyRentalFilter,
): PrismaTypes.RentalWhereInput {
  return {
    userId,
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.startStationId ? { startStationId: filter.startStationId } : {}),
    ...(filter.endStationId ? { endStationId: filter.endStationId } : {}),
  };
}

function toRentalOrderBy(
  req: PageRequest<RentalSortField>,
): PrismaTypes.RentalOrderByWithRelationInput {
  const sortBy = req.sortBy ?? "startTime";
  const sortDir = req.sortDir ?? "desc";
  switch (sortBy) {
    case "endTime":
      return { endTime: sortDir };
    case "status":
      return { status: sortDir };
    case "updatedAt":
      return { updatedAt: sortDir };
    case "startTime":
    default:
      return { startTime: sortDir };
  }
}

export function makeRentalRepository(client: PrismaClient): RentalRepo {
  const select = {
    id: true,
    userId: true,
    bikeId: true,
    startStationId: true,
    endStationId: true,
    startTime: true,
    endTime: true,
    duration: true,
    totalPrice: true,
    status: true,
    updatedAt: true,
  } as const;

  const mapToRentalRow = (raw: any): RentalRow => ({
    id: raw.id,
    userId: raw.userId,
    bikeId: raw.bikeId,
    startStationId: raw.startStationId,
    endStationId: raw.endStationId,
    startTime: raw.startTime,
    endTime: raw.endTime,
    durationMinutes: raw.duration,
    totalPrice: raw.totalPrice ? Number(raw.totalPrice) : null,
    status: raw.status,
    updatedAt: raw.updatedAt,
  });

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

        const where = toMyRentalsWhere(userId, { status: "RENTED" as RentalStatus });
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

        return Option.fromNullable(raw ? mapToRentalRow(raw) : null);
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

        return Option.fromNullable(raw ? mapToRentalRow(raw) : null);
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

        return Option.fromNullable(raw ? mapToRentalRow(raw) : null);
      });
    },
  };
}

export class RentalRepository extends Context.Tag("RentalRepository")<
  RentalRepository,
  RentalRepo
>() {}

export const RentalRepositoryLive = Layer.effect(
  RentalRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeRentalRepository(client);
  }),
);
