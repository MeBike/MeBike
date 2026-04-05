import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";

import type { RedistributionRepo } from "../redistribution.repository.types";

import { RedistributionRepositoryError } from "../../domain-errors";
import {
  detailedRedistributionRequestSelect,
  mapToRedistributionRequestDetail,
  mapToRedistributionRequestSummaryRow,
  summaryRedistributionRequestSelect,
  toAdminRedistributionRequestsWhere,
  toRedistributionOrderBy,
} from "../redistribution.repository.query";

export type RedistributionAdminReadRepo = Pick<
  RedistributionRepo,
  "adminListRequests" | "adminGetById"
>;

export function makeRedistributionAdminReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RedistributionAdminReadRepo {
  const summarySelect = summaryRedistributionRequestSelect;
  const detailedSelect = detailedRedistributionRequestSelect;

  return {
    adminListRequests(filter, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where = toAdminRedistributionRequestsWhere(filter);
        const orderBy = toRedistributionOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.redistributionRequest.count({ where }),
            catch: e =>
              new RedistributionRepositoryError({
                operation: "adminListRequests.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.redistributionRequest.findMany({
                where,
                skip,
                take,
                orderBy,
                select: summarySelect,
              }),
            catch: e =>
              new RedistributionRepositoryError({
                operation: "adminListRequests.findMany",
                cause: e,
              }),
          }),
        ]);

        const mappedItems = items.map(mapToRedistributionRequestSummaryRow);

        return makePageResult(mappedItems, total, page, pageSize);
      });
    },

    adminGetById(requestId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.redistributionRequest.findUnique({
              where: { id: requestId },
              select: detailedSelect,
            }),
          catch: e =>
            new RedistributionRepositoryError({
              operation: "findById",
              cause: e,
            }),
        });

        if (!raw) {
          return Option.none();
        }

        return Option.some(mapToRedistributionRequestDetail(raw));
      });
    },
  };
}
