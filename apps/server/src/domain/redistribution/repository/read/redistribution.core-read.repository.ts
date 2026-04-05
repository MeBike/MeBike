import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared";

import type { RedistributionRepo } from "../redistribution.repository.types";

import { RedistributionRepositoryError } from "../../domain-errors";
import {
  detailedRedistributionRequestSelect,
  mapToRedistributionRequestDetail,
  mapToRedistributionRequestRow,
  mapToRedistributionRequestSummaryRow,
  redistributionRequestSelect,
  summaryRedistributionRequestSelect,
  toRedistributionOrderBy,
} from "../redistribution.repository.query";

export type RedistributionCoreReadRepo = Pick<
  RedistributionRepo,
  "findById" | "findOne" | "findAndPopulate" | "listWithOffset"
>;

export function makeRedistributionCoreReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RedistributionCoreReadRepo {
  const select = redistributionRequestSelect;
  const summarySelect = summaryRedistributionRequestSelect;
  const detailedSelect = detailedRedistributionRequestSelect;

  return {
    findOne(where) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.redistributionRequest.findUnique({
              where,
              select,
            }),
          catch: e =>
            new RedistributionRepositoryError({
              operation: "findOne",
              cause: e,
            }),
        });

        if (!raw) {
          return Option.none();
        }
        return Option.fromNullable(raw).pipe(Option.map(mapToRedistributionRequestRow));
      });
    },

    findById(requestId) {
      return this.findOne({ id: requestId });
    },

    findAndPopulate(where) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.redistributionRequest.findUnique({
              where,
              select: detailedSelect,
            }),
          catch: e =>
            new RedistributionRepositoryError({
              operation: "findAndPopulate",
              cause: e,
            }),
        });

        if (!raw) {
          return Option.none();
        }
        return Option.fromNullable(raw).pipe(Option.map(mapToRedistributionRequestDetail));
      });
    },

    listWithOffset(where, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);
        const orderBy = toRedistributionOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.redistributionRequest.count({ where }),
            catch: e =>
              new RedistributionRepositoryError({
                operation: "listWithOffset.count",
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
  };
}
