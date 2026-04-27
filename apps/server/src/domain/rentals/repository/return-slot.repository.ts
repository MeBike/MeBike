import { Effect, Layer, Match, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type { ReturnSlotRepo } from "./return-slot.repository.types";

import {
  RentalRepositoryError,
  ReturnSlotUniqueViolation,
} from "../domain-errors";
import { mapToReturnSlotRow, returnSlotSelect } from "./return-slot.repository.query";
import { isKnownReturnSlotUniqueConstraint, uniqueTargets } from "./unique-violation";

export type {
  CreateActiveReturnSlotInput,
  ReturnSlotRepo,
} from "./return-slot.repository.types";

/**
 * Tạo Prisma-backed repository cho return-slot reservation.
 *
 * Repository này giữ toàn bộ chi tiết truy vấn liên quan tới:
 * - đọc slot ACTIVE thuần persistence,
 * - đọc slot còn hiệu lực theo cửa sổ thời gian,
 * - cleanup cục bộ và cleanup batch các slot đã quá hạn.
 *
 * @param db Prisma client hoặc transaction client dùng để thực thi truy vấn.
 */
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
      }).pipe(defectOn(RentalRepositoryError)),

    findUnexpiredActiveByRentalId: (rentalId, activeAfter) =>
      Effect.tryPromise({
        try: async () => {
          const raw = await client.returnSlotReservation.findFirst({
            where: {
              rentalId,
              status: "ACTIVE",
              reservedFrom: { gt: activeAfter },
            },
            select: returnSlotSelect,
            orderBy: { createdAt: "desc" },
          });

          return Option.fromNullable(raw).pipe(Option.map(mapToReturnSlotRow));
        },
        catch: cause =>
          new RentalRepositoryError({
            operation: "returnSlot.findUnexpiredActiveByRentalId",
            cause,
          }),
      }).pipe(defectOn(RentalRepositoryError)),

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
              (error) => {
                const constraint = uniqueTargets(error);

                return isKnownReturnSlotUniqueConstraint(constraint)
                  ? new ReturnSlotUniqueViolation({
                      operation: "returnSlot.createActive",
                      constraint,
                      cause: error,
                    })
                  : new RentalRepositoryError({
                      operation: "returnSlot.createActive",
                      cause: error,
                    });
              },
            ),
            Match.orElse(
              error =>
                new RentalRepositoryError({
                  operation: "returnSlot.createActive",
                  cause: error,
                }),
            ),
          ),
      }).pipe(
        Effect.map(mapToReturnSlotRow),
        defectOn(RentalRepositoryError),
      ),

    cancelActiveByRentalIdOlderThan: (rentalId, activeUntil, updatedAt) =>
      Effect.tryPromise({
        try: async () => {
          const result = await client.returnSlotReservation.updateMany({
            where: {
              rentalId,
              status: "ACTIVE",
              reservedFrom: { lte: activeUntil },
            },
            data: {
              status: "CANCELLED",
              updatedAt,
            },
          });

          return result.count;
        },
        catch: cause =>
          new RentalRepositoryError({
            operation: "returnSlot.cancelActiveByRentalIdOlderThan",
            cause,
          }),
      }).pipe(defectOn(RentalRepositoryError)),

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
      }).pipe(defectOn(RentalRepositoryError)),

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
      }).pipe(defectOn(RentalRepositoryError)),

    cancelActiveOlderThan: (activeUntil, updatedAt) =>
      Effect.tryPromise({
        try: async () => {
          const result = await client.returnSlotReservation.updateMany({
            where: {
              status: "ACTIVE",
              reservedFrom: { lte: activeUntil },
            },
            data: {
              status: "CANCELLED",
              updatedAt,
            },
          });

          return result.count;
        },
        catch: cause =>
          new RentalRepositoryError({
            operation: "returnSlot.cancelActiveOlderThan",
            cause,
          }),
      }).pipe(defectOn(RentalRepositoryError)),

    getStationCapacitySnapshot: (stationId, activeAfter) =>
      Effect.gen(function* () {
        const station = yield* Effect.tryPromise({
          try: () =>
            client.station.findUnique({
              where: { id: stationId },
              select: {
                id: true,
                totalCapacity: true,
                returnSlotLimit: true,
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
                where: {
                  stationId,
                  status: "ACTIVE",
                  ...(activeAfter
                    ? { reservedFrom: { gt: activeAfter } }
                    : {}),
                },
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
          totalCapacity: station.totalCapacity,
          returnSlotLimit: station.returnSlotLimit,
          totalBikes,
          activeReturnSlots,
        });
      }).pipe(defectOn(RentalRepositoryError)),
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
