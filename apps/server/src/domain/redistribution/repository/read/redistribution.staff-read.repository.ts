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
  toMyInStationRedistributionRequestsWhere,
  toRedistributionOrderBy,
} from "../redistribution.repository.query";

export type RedistributionStaffReadRepo = Pick<
  RedistributionRepo,
  "listMyInStationRequests" | "getMyInStationRequest"
>;

export function makeRedistributionStaffReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RedistributionStaffReadRepo {
  const summarySelect = summaryRedistributionRequestSelect;
  const detailedSelect = detailedRedistributionRequestSelect;

  return {
    listMyInStationRequests(userId, stationId, filter, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where = toMyInStationRedistributionRequestsWhere(userId, stationId, filter);
        const orderBy = toRedistributionOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.redistributionRequest.count({ where }),
            catch: e =>
              new RedistributionRepositoryError({
                operation: "listMyInStationRequests.count",
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
                operation: "listMyRequests.findMany",
                cause: e,
              }),
          }),
        ]);

        const mappedItems = items.map(mapToRedistributionRequestSummaryRow);

        return makePageResult(mappedItems, total, page, pageSize);
      });
    },

    getMyInStationRequest(userId, stationId, requestId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.redistributionRequest.findFirst({
              where: {
                id: requestId,
                requestedByUserId: userId,
                sourceStationId: stationId,
              },
              select: detailedSelect,
            }),
          catch: e =>
            new RedistributionRepositoryError({
              operation: "getMyRequestById",
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
