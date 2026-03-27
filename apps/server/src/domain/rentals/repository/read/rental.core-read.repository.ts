import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
  RentalStatus,
} from "generated/prisma/client";

import type { RentalRepo } from "../rental.repository.types";

import { RentalRepositoryError } from "../../domain-errors";
import { mapToRentalRow, rentalSelect } from "../rental.repository.query";

export type RentalCoreReadRepo = Pick<
  RentalRepo,
  "findActiveByBikeId" | "findActiveByUserId" | "findById"
>;

export function makeRentalCoreReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RentalCoreReadRepo {
  const select = rentalSelect;

  return {
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

        return Option.fromNullable(raw).pipe(Option.map(mapToRentalRow));
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

        return Option.fromNullable(raw).pipe(Option.map(mapToRentalRow));
      });
    },

    findById(rentalId) {
      return Effect.tryPromise({
        try: () =>
          client.rental.findUnique({
            where: { id: rentalId },
            select,
          }),
        catch: e =>
          new RentalRepositoryError({
            operation: "findById",
            cause: e,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(mapToRentalRow)),
        ),
      );
    },
  };
}
