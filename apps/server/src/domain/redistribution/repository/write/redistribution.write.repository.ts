import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
  RedistributionStatus,
} from "generated/prisma/client";

import type { RedistributionRepo } from "../redistribution.repository.types";

import { RedistributionRepositoryError } from "../../domain-errors";
import {
  mapToRedistributionRequestRow,
  redistributionRequestSelect,
} from "../redistribution.repository.query";

export type RedistributionWriteRepo = Pick<
  RedistributionRepo,
  "create" | "update"
>;

export function makeRedistributionWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RedistributionWriteRepo {
  const select = redistributionRequestSelect;

  return {
    create(data) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.redistributionRequest.create({
              data: {
                requestedByUserId: data.requestedByUserId,
                sourceStationId: data.sourceStationId,
                targetStationId: data.targetStationId ?? undefined,
                targetAgencyId: data.targetAgencyId ?? undefined,
                requestedQuantity: data.requestedQuantity,
                reason: data.reason,
                status: "PENDING_APPROVAL" as RedistributionStatus,
                items: data.bikeIds
                  ? {
                      create: data.bikeIds.map(bikeId => ({ bikeId })),
                    }
                  : undefined,
              },
              select,
            }),
          catch: e =>
            new RedistributionRepositoryError({
              operation: "create",
              cause: e,
            }),
        });

        return mapToRedistributionRequestRow(raw);
      });
    },

    update(where, data) {
      return Effect.tryPromise({
        try: async () => {
          const updated = await client.redistributionRequest.updateMany({
            where,
            data: {
              ...data,
              updatedAt: new Date(),
            },
          });

          if (updated.count === 0) {
            return null;
          }

          return await client.redistributionRequest.findUnique({
            where: { id: where.id },
            select,
          });
        },
        catch: e =>
          new RedistributionRepositoryError({
            operation: "update",
            cause: e,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(mapToRedistributionRequestRow)),
        ),
      );
    },
  };
}
