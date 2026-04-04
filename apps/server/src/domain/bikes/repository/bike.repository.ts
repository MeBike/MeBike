import { Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { BikeStatus, PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { pickDefined } from "@/domain/shared/pick-defined";
import { Prisma } from "@/infrastructure/prisma";
import { isPrismaRecordNotFound, isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type { BikeFilter, BikeRow, BikeSortField } from "../models";

import { BikeRepositoryError, DuplicateChipId } from "../domain-errors";

export type BikeRepo = {
  create: (
    input: {
      chipId: string;
      stationId: string;
      supplierId: string;
      status: BikeStatus;
    },
  ) => Effect.Effect<BikeRow, BikeRepositoryError | DuplicateChipId>;

  getById: (bikeId: string) => Effect.Effect<Option.Option<BikeRow>, BikeRepositoryError>;
  findAvailableByStation: (
    stationId: string,
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
  updateStatusAt: (
    bikeId: string,
    status: BikeStatus,
    updatedAt: Date,
  ) => Effect.Effect<Option.Option<BikeRow>, BikeRepositoryError>;
  updateStatusAndStationAt: (
    bikeId: string,
    status: BikeStatus,
    stationId: string,
    updatedAt: Date,
  ) => Effect.Effect<Option.Option<BikeRow>, BikeRepositoryError>;
  bookBikeIfAvailable: (
    bikeId: string,
    updatedAt: Date,
  ) => Effect.Effect<boolean, BikeRepositoryError>;
  reserveBikeIfAvailable: (
    bikeId: string,
    updatedAt: Date,
  ) => Effect.Effect<boolean, BikeRepositoryError>;
  bookBikeIfReserved: (
    bikeId: string,
    updatedAt: Date,
  ) => Effect.Effect<boolean, BikeRepositoryError>;
  releaseBikeIfReserved: (
    bikeId: string,
    updatedAt: Date,
  ) => Effect.Effect<boolean, BikeRepositoryError>;
  markBikesUnavailableIfAvailable: (
    bikeIds: string[],
    updatedAt: Date,
  ) => Effect.Effect<number, BikeRepositoryError>;

  updateById: (
    bikeId: string,
    patch: Partial<{
      chipId: string;
      stationId: string;
      status: BikeStatus;
      supplierId: string | null;
    }>,
  ) => Effect.Effect<Option.Option<BikeRow>, BikeRepositoryError | DuplicateChipId>;
};
const makeBikeRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeBikeRepository(client);
});

export class BikeRepository extends Effect.Service<BikeRepository>()(
  "BikeRepository",
  {
    effect: makeBikeRepositoryEffect,
  },
) {}

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

export function makeBikeRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): BikeRepo {
  const client = db;
  const select = {
    id: true,
    chipId: true,
    stationId: true,
    supplierId: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  const findById = (
    tx: PrismaClient | PrismaTypes.TransactionClient,
    bikeId: string,
  ) =>
    tx.bike.findUnique({ where: { id: bikeId }, select });

  return {
    create: input =>
      Effect.tryPromise({
        try: () =>
          client.bike.create({
            data: {
              chipId: input.chipId,
              stationId: input.stationId,
              supplierId: input.supplierId,
              status: input.status,
              updatedAt: new Date(),
            },
            select,
          }),
        catch: (err: unknown) => {
          if (isPrismaUniqueViolation(err)) {
            return new DuplicateChipId({ chipId: input.chipId });
          }
          return new BikeRepositoryError({
            operation: "create",
            cause: err,
            message: "Failed to create bike",
          });
        },
      }),

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

    findAvailableByStation: stationId =>
      Effect.tryPromise({
        try: () =>
          client.bike.findFirst({
            where: { stationId, status: "AVAILABLE" },
            select,
          }),
        catch: e =>
          new BikeRepositoryError({
            operation: "findAvailableByStation",
            cause: e,
            message: "Failed to find available bike by station",
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

    updateStatusAt: (bikeId, status, updatedAt) =>
      Effect.gen(function* () {
        const updated = yield* Effect.tryPromise({
          try: () =>
            client.bike.updateMany({
              where: { id: bikeId },
              data: { status, updatedAt },
            }),
          catch: e =>
            new BikeRepositoryError({
              operation: "updateStatusAt.updateMany",
              cause: e,
              message: "Failed to update bike status",
            }),
        });

        if (updated.count === 0) {
          return Option.none<BikeRow>();
        }

        const row = yield* Effect.tryPromise({
          try: () => findById(client, bikeId),
          catch: e =>
            new BikeRepositoryError({
              operation: "updateStatusAt.findUnique",
              cause: e,
              message: "Failed to fetch bike after status update",
            }),
        });

        return Option.fromNullable(row);
      }),

    updateStatusAndStationAt: (bikeId, status, stationId, updatedAt) =>
      Effect.gen(function* () {
        const updated = yield* Effect.tryPromise({
          try: () =>
            client.bike.updateMany({
              where: { id: bikeId },
              data: { status, stationId, updatedAt },
            }),
          catch: e =>
            new BikeRepositoryError({
              operation: "updateStatusAndStationAt.updateMany",
              cause: e,
              message: "Failed to update bike status and station",
            }),
        });

        if (updated.count === 0) {
          return Option.none<BikeRow>();
        }

        const row = yield* Effect.tryPromise({
          try: () => findById(client, bikeId),
          catch: e =>
            new BikeRepositoryError({
              operation: "updateStatusAndStationAt.findUnique",
              cause: e,
              message: "Failed to fetch bike after status and station update",
            }),
        });

        return Option.fromNullable(row);
      }),

    bookBikeIfAvailable: (bikeId, updatedAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.bike.updateMany({
            where: { id: bikeId, status: "AVAILABLE" },
            data: { status: "BOOKED", updatedAt },
          });
          return updated.count > 0;
        },
        catch: e =>
          new BikeRepositoryError({
            operation: "bookBikeIfAvailable",
            cause: e,
            message: "Failed to book available bike",
          }),
      }),

    reserveBikeIfAvailable: (bikeId, updatedAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.bike.updateMany({
            where: { id: bikeId, status: "AVAILABLE" },
            data: { status: "RESERVED", updatedAt },
          });
          return updated.count > 0;
        },
        catch: e =>
          new BikeRepositoryError({
            operation: "reserveBikeIfAvailable",
            cause: e,
            message: "Failed to reserve available bike",
          }),
      }),

    bookBikeIfReserved: (bikeId, updatedAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.bike.updateMany({
            where: { id: bikeId, status: "RESERVED" },
            data: { status: "BOOKED", updatedAt },
          });
          return updated.count > 0;
        },
        catch: e =>
          new BikeRepositoryError({
            operation: "bookBikeIfReserved",
            cause: e,
            message: "Failed to book reserved bike",
          }),
      }),

    releaseBikeIfReserved: (bikeId, updatedAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.bike.updateMany({
            where: { id: bikeId, status: "RESERVED" },
            data: { status: "AVAILABLE", updatedAt },
          });
          return updated.count > 0;
        },
        catch: e =>
          new BikeRepositoryError({
            operation: "releaseBikeIfReserved",
            cause: e,
            message: "Failed to release reserved bike",
          }),
      }),

    markBikesUnavailableIfAvailable: (bikeIds, updatedAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.bike.updateMany({
            where: { id: { in: bikeIds }, status: "AVAILABLE" },
            data: { status: "UNAVAILABLE", updatedAt },
          });
          return updated.count;
        },
        catch: e =>
          new BikeRepositoryError({
            operation: "markBikesUnavailableIfAvailable",
            cause: e,
            message: "Failed to mark bikes unavailable",
          }),
      }),

    updateById: (bikeId, patch) =>
      Effect.tryPromise({
        try: () =>
          client.bike.update({
            where: { id: bikeId },
            data: {
              ...pickDefined({
                chipId: patch.chipId,
                stationId: patch.stationId,
                status: patch.status,
                supplierId: patch.supplierId,
              }),
              updatedAt: new Date(),
            },
            select,
          }),
        catch: err => err as unknown,
      }).pipe(
        Effect.catchAll((err): Effect.Effect<BikeRow | null, BikeRepositoryError | DuplicateChipId> => {
          if (isPrismaRecordNotFound(err)) {
            return Effect.succeed<BikeRow | null>(null);
          }
          if (isPrismaUniqueViolation(err) && patch.chipId) {
            return Effect.fail(new DuplicateChipId({ chipId: patch.chipId }));
          }

          return Effect.fail(new BikeRepositoryError({
            operation: "updateById.update",
            cause: err,
            message: "Failed to update bike",
          }));
        }),
        Effect.map((row): Option.Option<BikeRow> => Option.fromNullable(row)),
      ),
  };
}

export const bikeRepositoryFactory = makeBikeRepository;

export const BikeRepositoryLive = Layer.effect(
  BikeRepository,
  makeBikeRepositoryEffect.pipe(Effect.map(BikeRepository.make)),
);
