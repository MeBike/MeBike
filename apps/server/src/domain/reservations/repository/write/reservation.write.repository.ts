import { Effect, Match } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { isPrismaRecordNotFound, isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";
import { uniqueTargets } from "@/infrastructure/prisma-unique-violation";
import { ReservationStatus } from "generated/prisma/client";

import type { CreateReservationInput, UpdateReservationStatusInput } from "../../types";
import type { ReservationRepo } from "../reservation.repository.types";

import {
  ReservationNotFound,
  ReservationRepositoryError,
  ReservationUniqueViolation,
} from "../../domain-errors";
import { selectReservationRow, toReservationRow } from "../reservation.mappers";

export type ReservationWriteRepo = Pick<
  ReservationRepo,
  | "createReservation"
  | "assignBikeToPendingReservation"
  | "updateStatus"
  | "expirePendingHold"
  | "markExpiredNow"
>;

export function makeReservationWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): ReservationWriteRepo {
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
    }).pipe(
      Effect.map(toReservationRow),
      defectOn(ReservationRepositoryError),
    );

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
            pricingPolicyId: input.pricingPolicyId ?? null,
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
    }).pipe(
      Effect.map(toReservationRow),
      defectOn(ReservationRepositoryError),
    );

  return {
    createReservation: input => createReservationWithClient(client, input),

    assignBikeToPendingReservation: (reservationId, bikeId, updatedAt) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.reservation.updateMany({
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
            operation: "assignBikeToPendingReservation",
            cause: err,
          }),
      }).pipe(defectOn(ReservationRepositoryError)),

    updateStatus: input => updateStatusWithClient(client, input),

    expirePendingHold: (reservationId, now) =>
      Effect.tryPromise({
        try: async () => {
          const result = await client.reservation.updateMany({
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
            operation: "expirePendingHold",
            cause: err,
          }),
      }).pipe(defectOn(ReservationRepositoryError)),

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
      }).pipe(
        Effect.map(result => result.count),
        defectOn(ReservationRepositoryError),
      ),

  };
}
