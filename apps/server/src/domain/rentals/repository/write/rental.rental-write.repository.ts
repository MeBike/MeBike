import { Effect, Match, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
  RentalStatus,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";
import { uniqueTargets } from "@/infrastructure/prisma-unique-violation";

import type { CreateRentalInput, RentalRepo } from "../rental.repository.types";

import {
  RentalRepositoryError,
  RentalUniqueViolation,
} from "../../domain-errors";
import { mapToRentalRow, rentalSelect } from "../rental.repository.query";

export type RentalRentalWriteRepo = Pick<
  RentalRepo,
  | "createRental"
  | "updateRentalDepositHold"
  | "updateRentalOnEnd"
  | "markOverdueUnreturned"
>;

export function makeRentalRentalWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RentalRentalWriteRepo {
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
            reservationId: data.reservationId ?? null,
            bikeId: data.bikeId,
            depositHoldId: data.depositHoldId ?? null,
            pricingPolicyId: data.pricingPolicyId ?? null,
            startStationId: data.startStationId,
            startTime: data.startTime,
            subscriptionId: data.subscriptionId ?? null,
            status: "RENTED" as RentalStatus,
          },
          select,
        }),
      catch: error =>
        Match.value(error).pipe(
          Match.when(
            isPrismaUniqueViolation,
            e =>
              new RentalUniqueViolation({
                operation: "createRental",
                constraint: uniqueTargets(e),
                cause: e,
              }),
          ),
          Match.orElse(
            e =>
              new RentalRepositoryError({
                operation: "createRental",
                cause: e,
              }),
          ),
        ),
    }).pipe(
      Effect.map(mapToRentalRow),
      defectOn(RentalRepositoryError),
    );

  return {
    createRental(data) {
      return createRentalWithClient(client, data);
    },

    updateRentalDepositHold(data) {
      return Effect.tryPromise({
        try: async () => {
          const updated = await client.rental.updateMany({
            where: {
              id: data.rentalId,
              depositHoldId: null,
            },
            data: {
              depositHoldId: data.depositHoldId,
            },
          });

          if (updated.count === 0) {
            return null;
          }

          return await client.rental.findUnique({
            where: { id: data.rentalId },
            select,
          });
        },
        catch: e =>
          new RentalRepositoryError({
            operation: "updateRentalDepositHold",
            cause: e,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(mapToRentalRow)),
        ),
        defectOn(RentalRepositoryError),
      );
    },

    updateRentalOnEnd(data) {
      return Effect.tryPromise({
        try: async () => {
          const updated = await client.rental.updateMany({
            where: {
              id: data.rentalId,
              status: "RENTED",
            },
            data: {
              pricingPolicyId: data.pricingPolicyId ?? undefined,
              endStationId: data.endStationId,
              endTime: data.endTime,
              duration: data.durationMinutes,
              totalPrice:
                data.totalPrice === null ? null : String(data.totalPrice),
              status: data.newStatus,
            },
          });

          if (updated.count === 0) {
            return null;
          }

          return await client.rental.findUnique({
            where: { id: data.rentalId },
            select,
          });
        },
        catch: e =>
          new RentalRepositoryError({
            operation: "updateRentalOnEnd",
            cause: e,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(mapToRentalRow)),
        ),
        defectOn(RentalRepositoryError),
      );
    },

    markOverdueUnreturned(data) {
      return Effect.tryPromise({
        try: async () => {
          const updated = await client.rental.updateMany({
            where: {
              id: data.rentalId,
              status: "RENTED",
            },
            data: {
              status: "OVERDUE_UNRETURNED" as RentalStatus,
              updatedAt: data.overdueAt,
            },
          });

          if (updated.count === 0) {
            return null;
          }

          return await client.rental.findUnique({
            where: { id: data.rentalId },
            select,
          });
        },
        catch: e =>
          new RentalRepositoryError({
            operation: "markOverdueUnreturned",
            cause: e,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(mapToRentalRow)),
        ),
        defectOn(RentalRepositoryError),
      );
    },
  };
}
