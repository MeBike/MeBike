import { Effect, Option } from "effect";

import type { BikeStatus } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { pickDefined } from "@/domain/shared/pick-defined";
import { isPrismaRecordNotFound, isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type { BikeDbClient } from "../bike.repository.shared";
import type { BikeCommandRepo, BikeCreateInput, BikeUpdatePatch } from "../bike.repository.types";

import { BikeRepositoryError, DuplicateChipId } from "../../domain-errors";
import { bikeSelect, buildStatusUpdate, findBikeById, getNextBikeNumber } from "../bike.repository.shared";

export function makeBikeWriteRepository(client: BikeDbClient): BikeCommandRepo {
  // Helper for updateMany operations
  function updateManyBikes(
    client: BikeDbClient,
    bikeIds: string[],
    data: Record<string, unknown>,
    operation: string,
  ): Effect.Effect<number> {
    if (bikeIds.length === 0) {
      return Effect.succeed(0);
    }

    return Effect.tryPromise({
      try: () =>
        client.bike.updateMany({
          where: { id: { in: bikeIds } },
          data,
        }),
      catch: cause =>
        new BikeRepositoryError({
          operation,
          cause,
          message: "Failed to update multiple bikes",
        }),
    }).pipe(
      Effect.map(result => result.count),
      defectOn(BikeRepositoryError),
    );
  }

  return {
    create: input =>
      Effect.tryPromise({
        try: () => createBike(client, input),
        catch: cause => handleCreateError(cause, input.chipId),
      }).pipe(defectOn(BikeRepositoryError)),

    updateStatus: (bikeId, status) =>
      updateAndReloadBike(client, bikeId, buildStatusUpdate(status, new Date()), "updateStatus"),

    updateStatusAt: (bikeId, status, updatedAt) =>
      updateAndReloadBike(client, bikeId, buildStatusUpdate(status, updatedAt), "updateStatusAt"),

    updateStatusAndStationAt: (bikeId, status, stationId, updatedAt) =>
      updateAndReloadBike(
        client,
        bikeId,
        { ...buildStatusUpdate(status, updatedAt), stationId },
        "updateStatusAndStationAt",
      ),

    updateManyStatusAt: (bikeIds: string[], status: BikeStatus, updatedAt: Date) =>
      updateManyBikes(client, bikeIds, { status, updatedAt }, "updateManyStatusAt"),

    updateManyStatusAndStationAt: (bikeIds: string[], status: BikeStatus, stationId: string, updatedAt: Date) =>
      updateManyBikes(
        client,
        bikeIds,
        { status, stationId, updatedAt },
        "updateManyStatusAndStationAt",
      ),

    updateManyStationAt: (bikeIds: string[], stationId: string | null, updatedAt: Date) =>
      updateManyBikes(
        client,
        bikeIds,
        { stationId, updatedAt },
        "updateManyStationAt",
      ),

    bookBikeIfAvailable: (bikeId, updatedAt) =>
      transitionBikeStatus(client, {
        bikeId,
        from: "AVAILABLE",
        to: "BOOKED",
        updatedAt,
        operation: "bookBikeIfAvailable",
      }),

    reserveBikeIfAvailable: (bikeId, updatedAt) =>
      transitionBikeStatus(client, {
        bikeId,
        from: "AVAILABLE",
        to: "RESERVED",
        updatedAt,
        operation: "reserveBikeIfAvailable",
      }),

    bookBikeIfReserved: (bikeId, updatedAt) =>
      transitionBikeStatus(client, {
        bikeId,
        from: "RESERVED",
        to: "BOOKED",
        updatedAt,
        operation: "bookBikeIfReserved",
      }),

    releaseBikeIfReserved: (bikeId, updatedAt) =>
      transitionBikeStatus(client, {
        bikeId,
        from: "RESERVED",
        to: "AVAILABLE",
        updatedAt,
        operation: "releaseBikeIfReserved",
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
            select: bikeSelect,
          }),
        catch: err => err as unknown,
      }).pipe(
        Effect.catchAll(cause => handleUpdateError(cause, patch)),
        Effect.map(row => Option.fromNullable(row)),
        defectOn(BikeRepositoryError),
      ),
  };
}

async function createBike(client: BikeDbClient, input: BikeCreateInput) {
  const createWithClient = async (tx: BikeDbClient) => {
    const bikeNumber = await getNextBikeNumber(tx);

    return tx.bike.create({
      data: {
        bikeNumber,
        chipId: input.chipId,
        stationId: input.stationId,
        supplierId: input.supplierId,
        status: input.status,
        updatedAt: new Date(),
      },
      select: bikeSelect,
    });
  };

  return "$transaction" in client
    ? client.$transaction(tx => createWithClient(tx))
    : createWithClient(client);
}

function handleCreateError(cause: unknown, chipId: string) {
  if (isPrismaUniqueViolation(cause)) {
    return new DuplicateChipId({ chipId });
  }

  return new BikeRepositoryError({
    operation: "create",
    cause,
    message: "Failed to create bike",
  });
}

function handleUpdateError(
  cause: unknown,
  patch: BikeUpdatePatch,
): Effect.Effect<null, BikeRepositoryError | DuplicateChipId> {
  if (isPrismaRecordNotFound(cause)) {
    return Effect.succeed(null);
  }

  if (isPrismaUniqueViolation(cause) && patch.chipId) {
    return Effect.fail(new DuplicateChipId({ chipId: patch.chipId }));
  }

  return Effect.fail(new BikeRepositoryError({
    operation: "updateById.update",
    cause,
    message: "Failed to update bike",
  }));
}

function updateAndReloadBike(
  client: BikeDbClient,
  bikeId: string,
  data: Record<string, unknown>,
  operation: string,
) {
  return Effect.gen(function* () {
    const updated = yield* Effect.tryPromise({
      try: () =>
        client.bike.updateMany({
          where: { id: bikeId },
          data,
        }),
      catch: cause =>
        new BikeRepositoryError({
          operation: `${operation}.updateMany`,
          cause,
          message: "Failed to update bike",
        }),
    });

    if (updated.count === 0) {
      return Option.none();
    }

    const row = yield* Effect.tryPromise({
      try: () => findBikeById(client, bikeId),
      catch: cause =>
        new BikeRepositoryError({
          operation: `${operation}.findUnique`,
          cause,
          message: "Failed to fetch bike after update",
        }),
    });

    return Option.fromNullable(row);
  }).pipe(defectOn(BikeRepositoryError));
}

function transitionBikeStatus(
  client: BikeDbClient,
  args: {
    bikeId: string;
    from: BikeStatus;
    to: BikeStatus;
    updatedAt: Date;
    operation: string;
  },
) {
  return Effect.tryPromise({
    try: async () => {
      const updated = await client.bike.updateMany({
        where: { id: args.bikeId, status: args.from },
        data: buildStatusUpdate(args.to, args.updatedAt),
      });

      return updated.count > 0;
    },
    catch: cause =>
      new BikeRepositoryError({
        operation: args.operation,
        cause,
        message: "Failed to transition bike status",
      }),
  }).pipe(defectOn(BikeRepositoryError));
}
