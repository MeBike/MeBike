import { Effect, Layer, Match, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
  ReturnSlotStatus,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";
import { uniqueTargets } from "@/infrastructure/prisma-unique-violation";

import type { ReturnSlotRepoError } from "../domain-errors";
import type {
  ReturnSlotRow,
  ReturnSlotStationCapacityRow,
} from "../models";

import {
  RentalRepositoryError,

  ReturnSlotUniqueViolation,
} from "../domain-errors";

type CreateActiveReturnSlotInput = {
  rentalId: string;
  userId: string;
  stationId: string;
  reservedFrom: Date;
};

export type ReturnSlotRepo = {
  findActiveByRentalId: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<ReturnSlotRow>, RentalRepositoryError>;
  createActive: (
    input: CreateActiveReturnSlotInput,
  ) => Effect.Effect<ReturnSlotRow, ReturnSlotRepoError>;
  cancelActiveByRentalId: (
    rentalId: string,
    updatedAt: Date,
  ) => Effect.Effect<Option.Option<ReturnSlotRow>, RentalRepositoryError>;
  finalizeActiveByRentalId: (
    rentalId: string,
    status: Extract<ReturnSlotStatus, "USED" | "CANCELLED">,
    updatedAt: Date,
  ) => Effect.Effect<Option.Option<ReturnSlotRow>, RentalRepositoryError>;
  getStationCapacitySnapshot: (
    stationId: string,
  ) => Effect.Effect<Option.Option<ReturnSlotStationCapacityRow>, RentalRepositoryError>;
};

const returnSlotSelect = {
  id: true,
  rentalId: true,
  userId: true,
  stationId: true,
  reservedFrom: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

function mapToReturnSlotRow(raw: {
  id: string;
  rentalId: string;
  userId: string;
  stationId: string;
  reservedFrom: Date;
  status: ReturnSlotStatus;
  createdAt: Date;
  updatedAt: Date;
}): ReturnSlotRow {
  return raw;
}

export function makeReturnSlotRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): ReturnSlotRepo {
  const client = db;

  return {
    findActiveByRentalId: rentalId =>
      Effect.tryPromise({
        try: async () => {
          const raw = await client.returnSlotReservation.findFirst({
            where: { rentalId, status: "ACTIVE" },
            select: returnSlotSelect,
            orderBy: { createdAt: "desc" },
          });

          return Option.fromNullable(raw).pipe(Option.map(mapToReturnSlotRow));
        },
        catch: cause =>
          new RentalRepositoryError({
            operation: "returnSlot.findActiveByRentalId",
            cause,
          }),
      }),

    createActive: input =>
      Effect.tryPromise({
        try: () =>
          client.returnSlotReservation.create({
            data: {
              rentalId: input.rentalId,
              userId: input.userId,
              stationId: input.stationId,
              reservedFrom: input.reservedFrom,
              status: "ACTIVE",
            },
            select: returnSlotSelect,
          }),
        catch: cause =>
          Match.value(cause).pipe(
            Match.when(
              isPrismaUniqueViolation,
              error =>
                new ReturnSlotUniqueViolation({
                  operation: "returnSlot.createActive",
                  constraint: uniqueTargets(error),
                  cause: error,
                }),
            ),
            Match.orElse(
              error =>
                new RentalRepositoryError({
                  operation: "returnSlot.createActive",
                  cause: error,
                }),
            ),
          ),
      }).pipe(Effect.map(mapToReturnSlotRow)),

    cancelActiveByRentalId: (rentalId, updatedAt) =>
      Effect.gen(function* () {
        const active = yield* Effect.tryPromise({
          try: () =>
            client.returnSlotReservation.findFirst({
              where: { rentalId, status: "ACTIVE" },
              select: returnSlotSelect,
              orderBy: { createdAt: "desc" },
            }),
          catch: cause =>
            new RentalRepositoryError({
              operation: "returnSlot.cancelActiveByRentalId.find",
              cause,
            }),
        });

        if (!active) {
          return Option.none();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.returnSlotReservation.update({
              where: { id: active.id },
              data: { status: "CANCELLED", updatedAt },
              select: returnSlotSelect,
            }),
          catch: cause =>
            new RentalRepositoryError({
              operation: "returnSlot.cancelActiveByRentalId.update",
              cause,
            }),
        });

        return Option.some(mapToReturnSlotRow(updated));
      }),

    finalizeActiveByRentalId: (rentalId, status, updatedAt) =>
      Effect.gen(function* () {
        const active = yield* Effect.tryPromise({
          try: () =>
            client.returnSlotReservation.findFirst({
              where: { rentalId, status: "ACTIVE" },
              select: returnSlotSelect,
              orderBy: { createdAt: "desc" },
            }),
          catch: cause =>
            new RentalRepositoryError({
              operation: "returnSlot.finalizeActiveByRentalId.find",
              cause,
            }),
        });

        if (!active) {
          return Option.none();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.returnSlotReservation.update({
              where: { id: active.id },
              data: { status, updatedAt },
              select: returnSlotSelect,
            }),
          catch: cause =>
            new RentalRepositoryError({
              operation: "returnSlot.finalizeActiveByRentalId.update",
              cause,
            }),
        });

        return Option.some(mapToReturnSlotRow(updated));
      }),

    getStationCapacitySnapshot: stationId =>
      Effect.gen(function* () {
        const station = yield* Effect.tryPromise({
          try: () =>
            client.station.findUnique({
              where: { id: stationId },
              select: {
                id: true,
                capacity: true,
              },
            }),
          catch: cause =>
            new RentalRepositoryError({
              operation: "returnSlot.getStationCapacitySnapshot.station",
              cause,
            }),
        });

        if (!station) {
          return Option.none();
        }

        const [totalBikes, activeReturnSlots] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.bike.count({ where: { stationId } }),
            catch: cause =>
              new RentalRepositoryError({
                operation: "returnSlot.getStationCapacitySnapshot.totalBikes",
                cause,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.returnSlotReservation.count({
                where: { stationId, status: "ACTIVE" },
              }),
            catch: cause =>
              new RentalRepositoryError({
                operation: "returnSlot.getStationCapacitySnapshot.activeReturnSlots",
                cause,
              }),
          }),
        ]);

        return Option.some({
          stationId: station.id,
          capacity: station.capacity,
          totalBikes,
          activeReturnSlots,
        });
      }),
  };
}

const makeReturnSlotRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeReturnSlotRepository(client);
});

export class ReturnSlotRepository extends Effect.Service<ReturnSlotRepository>()(
  "ReturnSlotRepository",
  {
    effect: makeReturnSlotRepositoryEffect,
  },
) {}

export const ReturnSlotRepositoryLive = Layer.effect(
  ReturnSlotRepository,
  makeReturnSlotRepositoryEffect.pipe(Effect.map(ReturnSlotRepository.make)),
);
