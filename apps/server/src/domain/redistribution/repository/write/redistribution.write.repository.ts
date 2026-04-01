import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { RedistributionRepo } from "../redistribution.repository.types";

import { RedistributionRepositoryError } from "../../domain-errors";
import {
  mapToRedistributionRequestRow,
  redistributionRequestSelect,
} from "../redistribution.repository.query";

export type RedistributionWriteRepo = Pick<
  RedistributionRepo,
  "createRequest" | "updateRequestStatus"
>;

export function makeRedistributionWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RedistributionWriteRepo {
  const select = redistributionRequestSelect;

  return {
    createRequest(data) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.redistributionRequest.create({
              data: {
                requestedByUserId: data.requestedByUserId,
                sourceStationId: data.sourceStationId,
                targetStationId: data.targetStationId ?? null,
                targetAgencyId: data.targetAgencyId ?? null,
                requestedQuantity: data.requestedQuantity,
                reason: data.reason,
                status: "PENDING_APPROVAL",
              },
              select,
            }),
          catch: e =>
            new RedistributionRepositoryError({
              operation: "createRequest",
              cause: e,
            }),
        });

        return mapToRedistributionRequestRow(raw);
      });
    },

    updateRequestStatus(data) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.redistributionRequest.update({
              where: { id: data.requestId },
              data: {
                status: data.status,
                approvedByUserId: data.approvedByUserId ?? null,
                updatedAt: new Date(),
              },
              select,
            }),
          catch: e =>
            new RedistributionRepositoryError({
              operation: "updateRequestStatus",
              cause: e,
            }),
        });

        return Option.some(mapToRedistributionRequestRow(raw));
      }).pipe(
        Effect.catchTag("RedistributionRepositoryError", (error) => {
          // If update fails due to not found, return none
          if (error.cause instanceof Error && error.cause.message.includes("not found")) {
            return Effect.succeed(Option.none());
          }
          return Effect.fail(error);
        }),
      );
    },
  };
}
