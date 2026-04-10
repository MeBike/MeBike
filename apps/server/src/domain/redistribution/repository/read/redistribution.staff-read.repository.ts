import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
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
    listMyInStationRequests: (userId, stationId, filter, pageReq) =>
      Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where = toMyInStationRedistributionRequestsWhere(
          userId,
          stationId,
          filter,
        );
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
                operation: "listMyInStationRequests.findMany",
                cause: e,
              }),
          }),
        ]);

        const mappedItems = items.map(mapToRedistributionRequestSummaryRow);

        return makePageResult(mappedItems, total, page, pageSize);
      }).pipe(defectOn(RedistributionRepositoryError)),

    getMyInStationRequest: (userId, stationId, requestId) =>
      Effect.tryPromise({
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
            operation: "getMyInStationRequest",
            cause: e,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(
            Option.map(mapToRedistributionRequestDetail),
          ),
        ),
        defectOn(RedistributionRepositoryError),
      ),
  };
}
