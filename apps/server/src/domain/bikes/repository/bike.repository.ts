import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { BikeStatus, PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";

import type { BikeFilter, BikeRow, BikeSortField } from "../models";

import { BikeRepositoryError } from "../domain-errors";

export type BikeRepo = {
  getById: (bikeId: string) => Effect.Effect<Option.Option<BikeRow>, BikeRepositoryError>;
  getByIdInTx: (
    tx: PrismaTypes.TransactionClient,
    bikeId: string,
  ) => Effect.Effect<Option.Option<BikeRow>, BikeRepositoryError>;
  listByStationWithOffset: (
    stationId: string | undefined,
    filter: BikeFilter,
    pageReq: PageRequest<BikeSortField>,
  ) => Effect.Effect<PageResult<BikeRow>, BikeRepositoryError>;
  updateStatus: (
    bikeId: string,
    status: BikeStatus,
  ) => Effect.Effect<Option.Option<BikeRow>, BikeRepositoryError>;
  updateStatusInTx: (
    tx: PrismaTypes.TransactionClient,
    bikeId: string,
    status: BikeStatus,
    updatedAt: Date,
  ) => Effect.Effect<Option.Option<BikeRow>, BikeRepositoryError>;
};
export class BikeRepository extends Context.Tag("BikeRepository")<
  BikeRepository,
  BikeRepo
>() {}

export function toBikeOrderBy(
  req: PageRequest<BikeSortField>,
): PrismaTypes.BikeOrderByWithRelationInput {
  const sortBy: BikeSortField = req.sortBy ?? "status";
  const sortDir = req.sortDir ?? "asc";
  switch (sortBy) {
    case "name":
      return { chipId: sortDir };
    case "status":
    default:
      return { status: sortDir };
  }
}

export function makeBikeRepository(client: PrismaClient): BikeRepo {
  const select = {
    id: true,
    chipId: true,
    stationId: true,
    supplierId: true,
    status: true,
  } as const;

  const findById = (
    tx: PrismaClient | PrismaTypes.TransactionClient,
    bikeId: string,
  ) =>
    tx.bike.findUnique({ where: { id: bikeId }, select });

  return {
    getById: (bikeId: string) =>
      Effect.tryPromise({
        try: () =>
          findById(client, bikeId),
        catch: e =>
          new BikeRepositoryError({
            operation: "getById",
            cause: e,
            message: "Failed to fetch bike by id",
          }),
      }).pipe(Effect.map(Option.fromNullable)),

    getByIdInTx: (tx, bikeId) =>
      Effect.tryPromise({
        try: () => findById(tx, bikeId),
        catch: e =>
          new BikeRepositoryError({
            operation: "getByIdInTx",
            cause: e,
            message: "Failed to fetch bike by id",
          }),
      }).pipe(Effect.map(Option.fromNullable)),

    listByStationWithOffset: (stationId, filter, pageReq) => {
      const { page, pageSize, skip, take } = normalizedPage(pageReq);

      const where: PrismaTypes.BikeWhereInput = {
        ...(stationId ? { stationId } : {}),
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.supplierId ? { supplierId: filter.supplierId } : {}),
        ...(filter.id ? { id: filter.id } : {}),
      };

      const orderBy = toBikeOrderBy(pageReq);

      return Effect.gen(function* () {
        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.bike.count({ where }),
            catch: e =>
              new BikeRepositoryError({
                operation: "listByStationWithOffset.count",
                cause: e,
                message: "Failed to count bikes",
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.bike.findMany({ where, skip, take, orderBy, select }),
            catch: e =>
              new BikeRepositoryError({
                operation: "listByStationWithOffset.findMany",
                cause: e,
                message: "Failed to list bikes",
              }),
          }),
        ]);

        return makePageResult(items, total, page, pageSize);
      });
    },

    updateStatus: (bikeId, status) =>
      Effect.gen(function* () {
        const updated = yield* Effect.tryPromise({
          try: () =>
            client.bike.updateMany({
              where: { id: bikeId },
              data: { status },
            }),
          catch: e =>
            new BikeRepositoryError({
              operation: "updateStatus.updateMany",
              cause: e,
              message: "Failed to update bike status",
            }),
        });

        if (updated.count === 0) {
          return Option.none<BikeRow>();
        }

        const row = yield* Effect.tryPromise({
          try: () =>
            findById(client, bikeId),
          catch: e =>
            new BikeRepositoryError({
              operation: "updateStatus.findUnique",
              cause: e,
              message: "Failed to fetch bike after status update",
            }),
        });

        return Option.fromNullable(row);
      }),

    updateStatusInTx: (tx, bikeId, status, updatedAt) =>
      Effect.gen(function* () {
        const updated = yield* Effect.tryPromise({
          try: () =>
            tx.bike.updateMany({
              where: { id: bikeId },
              data: { status, updatedAt },
            }),
          catch: e =>
            new BikeRepositoryError({
              operation: "updateStatusInTx.updateMany",
              cause: e,
              message: "Failed to update bike status",
            }),
        });

        if (updated.count === 0) {
          return Option.none<BikeRow>();
        }

        const row = yield* Effect.tryPromise({
          try: () => findById(tx, bikeId),
          catch: e =>
            new BikeRepositoryError({
              operation: "updateStatusInTx.findUnique",
              cause: e,
              message: "Failed to fetch bike after status update",
            }),
        });

        return Option.fromNullable(row);
      }),
  };
}

export const bikeRepositoryFactory = makeBikeRepository;

export const BikeRepositoryLive = Layer.effect(
  BikeRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeBikeRepository(client);
  }),
);
