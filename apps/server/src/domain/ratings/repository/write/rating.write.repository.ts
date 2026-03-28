import { Effect } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type { RatingRepo } from "../rating.repository.types";

import { RatingAlreadyExists, RatingRepositoryError } from "../../domain-errors";
import { selectRatingRow, toRatingRow } from "../rating.mappers";

export type RatingWriteRepo = Pick<RatingRepo, "createRating">;

export function makeRatingWriteRepository(
  client: PrismaClient,
): RatingWriteRepo {
  return {
    createRating: input =>
      Effect.tryPromise({
        try: () =>
          client.$transaction(async (tx: PrismaTypes.TransactionClient) => {
            const reasons = await tx.ratingReason.findMany({
              where: { id: { in: input.reasonIds as string[] } },
              select: { id: true, appliesTo: true },
            });

            return tx.rating.create({
              data: {
                userId: input.userId,
                rentalId: input.rentalId,
                bikeId: input.bikeId ?? null,
                stationId: input.stationId ?? null,
                bikeScore: input.bikeScore,
                stationScore: input.stationScore,
                comment: input.comment ?? null,
                reasons: {
                  createMany: {
                    data: reasons.map(reason => ({
                      reasonId: reason.id,
                      target: reason.appliesTo,
                    })),
                  },
                },
              },
              select: selectRatingRow,
            });
          }),
        catch: (err) => {
          if (isPrismaUniqueViolation(err)) {
            return new RatingAlreadyExists({ rentalId: input.rentalId });
          }
          return new RatingRepositoryError({
            operation: "createRating",
            cause: err,
          });
        },
      }).pipe(Effect.map(toRatingRow)),
  };
}
