import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { ReservationStatus } from "generated/prisma/client";

import type { ReservationRepo } from "../reservation.repository.types";

import { ReservationRepositoryError } from "../../domain-errors";
import {
  selectReservationExpandedDetailRow,
  selectReservationRow,
  toReservationExpandedDetailRow,
  toReservationRow,
} from "../reservation.mappers";

export type ReservationCoreReadRepo = Pick<
  ReservationRepo,
  "findById" | "findExpandedDetailById" | "findPendingFixedSlotByTemplateAndStart"
>;

export function makeReservationCoreReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): ReservationCoreReadRepo {
  return {
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
        defectOn(ReservationRepositoryError),
      ),

    findExpandedDetailById: reservationId =>
      Effect.tryPromise({
        try: () =>
          client.reservation.findUnique({
            where: { id: reservationId },
            select: selectReservationExpandedDetailRow,
          }),
        catch: err =>
          new ReservationRepositoryError({
            operation: "findExpandedDetailById",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationExpandedDetailRow)),
        ),
        defectOn(ReservationRepositoryError),
      ),

    findPendingFixedSlotByTemplateAndStart: (templateId, startTime) =>
      Effect.tryPromise({
        try: () =>
          client.reservation.findFirst({
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
            operation: "findPendingFixedSlotByTemplateAndStart",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toReservationRow)),
        ),
        defectOn(ReservationRepositoryError),
      ),
  };
}
