import { Effect, Match, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
  RedistributionStatus,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";

import type {
  CreateRedistributionRequestInput,
  RedistributionRepo,
} from "../redistribution.repository.types";

import { RedistributionRepositoryError } from "../../domain-errors";
import {
  detailedRedistributionRequestSelect,
  mapToRedistributionRequestDetail,
  mapToRedistributionRequestRow,
  redistributionRequestSelect,
} from "../redistribution.repository.query";

export type RedistributionWriteRepo = Pick<
  RedistributionRepo,
  "create" | "update" | "updateAndFindWithPopulation" | "updateItemDeliveredAt"
>;

export function makeRedistributionWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RedistributionWriteRepo {
  const select = redistributionRequestSelect;
  const detailedSelect = detailedRedistributionRequestSelect;

  const createWithClient = (
    tx: PrismaClient | PrismaTypes.TransactionClient,
    data: CreateRedistributionRequestInput,
  ) =>
    Effect.tryPromise({
      try: async () =>
        tx.redistributionRequest.create({
          data: {
            requestedByUserId: data.requestedByUserId,
            sourceStationId: data.sourceStationId,
            targetStationId: data.targetStationId,
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
    }).pipe(
      Effect.map(mapToRedistributionRequestRow),
      defectOn(RedistributionRepositoryError),
    );
  return {
    create(data) {
      return createWithClient(client, data);
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
          Option.fromNullable(row).pipe(
            Option.map(mapToRedistributionRequestRow),
          ),
        ),
        defectOn(RedistributionRepositoryError),
      );
    },

    updateAndFindWithPopulation(where, data) {
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
            select: detailedSelect,
          });
        },
        catch: e =>
          new RedistributionRepositoryError({
            operation: "update",
            cause: e,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(
            Option.map(mapToRedistributionRequestDetail),
          ),
        ),
        defectOn(RedistributionRepositoryError),
      );
    },

    updateItemDeliveredAt(requestId, bikeIds, deliveredAt) {
      return Effect.tryPromise({
        try: async () => {
          await client.redistributionRequestItem.updateMany({
            where: {
              redistributionRequestId: requestId,
              bikeId: { in: bikeIds },
              deliveredAt: null, // Only update if not already delivered
            },
            data: {
              deliveredAt,
            },
          });
        },
        catch: e =>
          new RedistributionRepositoryError({
            operation: "updateItemDeliveredAt",
            cause: e,
          }),
      }).pipe(
        Effect.asVoid,
        defectOn(RedistributionRepositoryError),
      );
    },
  };
}
